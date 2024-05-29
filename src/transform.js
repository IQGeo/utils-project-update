const aptGetMappingsBuild = {
    memcached: ['libmemcached-dev'],
    ldap: ['libsasl2-dev', 'libldap2-dev'],
    saml: ['libxml2-dev', 'libxmlsec1-dev']
};

const aptGetMappingsRuntime = {
    memcached: ['libmemcached11'],
    ldap: ['libsasl2-dev', 'libldap2-dev'], // ENH: identify the correct runtime packages
    saml: ['libxml2-dev', 'libxmlsec1-dev'] // ENH: identify the correct runtime packages
};

// Transformers

/**
 * @type {Transformer}
 */
const initDbModifier = (config, content) => {
    const { modules } = config;

    const section1 = modules
        .filter(({ version, dbInit = !!version }) => dbInit)
        .map(
            ({ name, schemaGrep = name }) =>
                `if ! myw_db $MYW_DB_NAME list versions | grep ${schemaGrep}; then myw_db $MYW_DB_NAME install ${name}; fi`
        )
        .join('\n');

    return content.replace(
        /(# START SECTION db init.*)[\s\S]*?(# END SECTION)/,
        `$1\n${section1}\n$2`
    );
};

/**
 * @type {Record<string, Transformer>}
 */
export const fileTransformers = {
    '.gitignore': (config, content) => {
        const { modules } = config;
        const productModules = modules
            .filter(({ version }) => !!version)
            .concat([{ name: 'dev_tools' }]);
        const newContent = productModules.map(({ name }) => `./${name}`).join('\n');

        content = content.replace(
            /(# START SECTION Product modules)[\s\S]*?(.*# END SECTION)/,
            `$1\n${newContent}\n$2`
        );
        return content;
    },
    
    '.devcontainer/dockerfile': (config, content) => {
        const { modules, platform } = config;

        content = replaceModuleInjection(content, modules, true);
        content = replaceOptionalDeps(content, platform.devenv);
        content = replaceFetchPipPackages(content, platform.devenv);

        return content.replace(/platform-devenv:.*/, `platform-devenv:${platform.version}`);
    },

    '.devcontainer/docker-compose.yml': (config, content) => {
        const { modules, prefix, db_name } = config;
        const localModules = modules.filter(def => !def.version || def.devSrc);
        const newContent = localModules
            .map(
                ({ name, devSrc }) =>
                    `            - ../${devSrc}:/opt/iqgeo/platform/WebApps/myworldapp/modules/${name}:delegated`
            )
            .join('\n');

        return content
            .replace(/(# START SECTION.*)[\s\S]*?(.*# END SECTION)/, `$1\n${newContent}\n$2`)
            .replace(/\${PROJ_PREFIX:-myproj}/g, `\${PROJ_PREFIX:-${prefix}}`)
            .replace(/\${MYW_DB_NAME:-iqgeo}/g, `\${MYW_DB_NAME:-${db_name}}`)
            .replace(/iqgeo_devserver:/, `iqgeo_${prefix}_devserver:`);
    },

    '.devcontainer/.env.example': (config, content) => {
        const { prefix, db_name } = config;

        return content
            .replace(`PROJ_PREFIX=myproj`, `PROJ_PREFIX=${prefix}`)
            .replace(`COMPOSE_PROJECT_NAME=myproj_dev\n`, `COMPOSE_PROJECT_NAME=${prefix}_dev\n`)
            .replace(`MYW_DB_NAME=dev_db\n`, `MYW_DB_NAME=${db_name}\n`);
    },

    '.devcontainer/devcontainer.json': (config, content) => {
        const { prefix, display_name } = config;

        return content
            .replace(`"name": "IQGeo Module Development Template"`, `"name": "${display_name}"`)
            .replace(`"service": "iqgeo_devserver"`, `"service": "iqgeo_${prefix}_devserver"`);
    },

    'deployment/dockerfile.build': (config, content) => {
        const { modules, platform } = config;

        return replaceModuleInjection(content, modules).replace(
            /platform-build:\S+/g,
            `platform-build:${platform.version}`
        );
    },

    'deployment/dockerfile.appserver': (config, content) => {
        const { modules, platform } = config;

        content = replaceOptionalDeps(content, platform.appserver, 'build');
        content = replaceOptionalDeps(content, platform.appserver, 'runtime');
        content = replaceFetchPipPackages(content, platform.devenv);

        content = content.replace(
            /platform-appserver:\S+/g,
            `platform-appserver:${platform.version}`
        );

        const section2 = modules
            .filter(({ devOnly }) => !devOnly)
            .map(
                ({ name }) =>
                    `COPY --chown=www-data:www-data --from=iqgeo_builder \${MODULES}/${name}/ \${MODULES}/${name}/`
            )
            .join('\n');

        return content.replace(
            /(# START SECTION Copy modules.*)[\s\S]*?(# END SECTION)/,
            `$1\n${section2}\n$2`
        );
    },

    'deployment/dockerfile.tools': (config, content) => {
        const { platform } = config;

        return content.replace(/platform-tools:\S+/g, `platform-tools:${platform.version}`);
    },

    'deployment/docker-compose.yml': (config, content) => {
        const { prefix, db_name } = config;

        return content
            .replace(/\${PROJ_PREFIX:-myproj}/g, `\${PROJ_PREFIX:-${prefix}}`)
            .replace(/\${MYW_DB_NAME:-iqgeo}/g, `\${MYW_DB_NAME:-${db_name}}`);
    },

    'deployment/.env.example': (config, content) => {
        const { prefix, db_name } = config;

        return content
            .replace(`PROJ_PREFIX=myproj\n`, `PROJ_PREFIX=${prefix}\n`)
            .replace(`MYW_DB_NAME=myproj\n`, `MYW_DB_NAME=${db_name}\n`);
    },

    'deployment/entrypoint.d/600_init_db.sh': initDbModifier,
    '.devcontainer/entrypoint.d/600_init_db.sh': initDbModifier
};

// Helpers

/**
 * @param {string} content
 * @param {Module[]} modules
 * @param {boolean} [isDevEnv=false]
 * @returns {string}
 */
function replaceModuleInjection(content, modules, isDevEnv = false) {
    /** @type {(module: Module) => boolean} */
    const isFromInjectorFn = ({ version, devSrc }) => !!version && !devSrc;
    /** @type {(module: Module) => boolean} */
    const filter1 = isDevEnv ? isFromInjectorFn : ({ version }) => !!version;

    const section1 = modules
        .filter(filter1)
        .map(({ name, version }) => `FROM \${CONTAINER_REGISTRY}${name}:${version} as ${name}`)
        .join('\n');

    const replacedContent = content.replace(
        /(# START SECTION Aliases for Injector images.*)[\s\S]*?(# END SECTION)/,
        `$1\n${section1}\n$2`
    );

    /** @type {(module: Module) => boolean} */
    const filter2 = isDevEnv ? isFromInjectorFn : ({ devOnly }) => !devOnly;

    const section2 = modules
        .filter(filter2)
        .map(({ name, version }) =>
            version
                ? `COPY --link --from=${name} / \${MODULES}/`
                : `COPY --link ${name} \${MODULES}/${name}`
        )
        .join('\n');

    return replacedContent.replace(
        /(# START SECTION Copy the modules.*)[\s\S]*?(# END SECTION)/,
        `$1\n${section2}\n$2`
    );
}

/**
 * @param {string} content
 * @param {string[]} [optionalDeps=[]]
 * @param {'build' | 'runtime'} [type='build']
 * @returns {string}
 */
function replaceOptionalDeps(content, optionalDeps = [], type = 'build') {
    const aptGetMappings = type === 'build' ? aptGetMappingsBuild : aptGetMappingsRuntime;
    const aptGets = optionalDeps
        .map(name => aptGetMappings[/** @type {keyof typeof aptGetMappings} */ (name)] ?? [])
        .flat()
        .join(' ');
    const section1 = aptGets
        ? `RUN apt-get update && \\\n    apt-get install -y ${aptGets} \\\n    && apt-get autoremove && apt-get clean`
        : '';

    return content.replace(
        type === 'build'
            ? /(# START SECTION optional dependencies \(build.*)[\s\S]*?(# END SECTION)/
            : /(# START SECTION optional dependencies \(runtime.*)[\s\S]*?(# END SECTION)/,
        `$1\n${section1}\n$2`
    );
}

/**
 * @param {string} content
 * @param {string[]} [optionalDeps=[]]
 * @returns {string}
 */
function replaceFetchPipPackages(content, optionalDeps = []) {
    return content.replace(
        /(RUN myw_product fetch pip_packages.*)/,
        optionalDeps?.length
            ? `RUN myw_product fetch pip_packages --include ${optionalDeps.join(' ')}`
            : 'RUN myw_product fetch pip_packages'
    );
}

// Types

/**
 * @typedef {import("./typedef.js").Platform} Platform
 * @typedef {import("./typedef.js").Module} Module
 * @typedef {import("./typedef.js").Config} Config
 * @typedef {import("./typedef.js").Transformer} Transformer
 */
