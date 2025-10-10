import * as jsonc from 'jsonc-parser';
import semver from 'semver';

const aptGetMappings = {
    build: {
        memcached: ['libmemcached-dev'],
        ldap: ['libsasl2-dev', 'libldap2-dev'],
        saml: ['libxml2-dev', 'libxmlsec1-dev']
    },
    runtime: {
        memcached: ['libmemcached11'],
        ldap: ['libsasl2-dev', 'libldap2-dev'], //ENH: identify the correct runtime packages
        saml: ['libxml2-dev', 'libxmlsec1-dev'], //ENH: identify the correct runtime packages
        osm: ['osm2pgsql', 'osmctools']
    },
    dev: {
        //dev is a combination of build and runtime, calculated further down
    }
};

/** @type {Record<string, any> } */
const pipPackagesMappings = {
    osm: []
};

// Transformers

/**
 * @type {Transformer}
 */
const initDbModifier = (config, content) => {
    const { modules } = config;

    const section1 = modules
        .filter(({ version, dbInit = !!version, schemaVersionName }) => dbInit && schemaVersionName)
        .map(
            ({ name, schemaVersionName }) =>
                `if ! myw_db $MYW_DB_NAME list versions --layout keys | grep ${schemaVersionName} | grep version=; then myw_db $MYW_DB_NAME install ${name}; fi`
        )
        .join('\n');

    return content.replace(
        /(# START SECTION db init.*)[\s\S]*?(# END SECTION)/,
        `$1\n${section1}\n$2`
    );
};

/**
 * @type {Transformer}
 */
const upgradeDbModifier = (config, content) => {
    const { modules } = config;

    const section1 = modules
        .filter(({ version, dbInit = !!version, schemaVersionName }) => dbInit && schemaVersionName)
        .map(
            ({ name, schemaVersionName }) =>
                `if myw_db $MYW_DB_NAME list versions --layout keys | grep ${schemaVersionName} | grep version=; then myw_db $MYW_DB_NAME upgrade ${name}; fi`
        )
        .join('\n');

    return content.replace(
        /(# START SECTION db upgrade.*)[\s\S]*?(# END SECTION)/,
        `$1\n${section1}\n$2`
    );
};

/**
 * @satisfies {Partial<Record<TemplateFilePath, Transformer>>}
 */
export const fileTransformers = {
    '.gitignore': (config, content) => {
        const { modules } = config;
        const productModules = modules
            .filter(({ isExternal }) => isExternal)
            .concat([{ name: 'dev_tools' }]);

        const names = modules.map(({ name }) => name);
        if (!names.includes('custom')) productModules.push({ name: 'custom' });

        const newContent = productModules.map(({ name }) => `/${name}`).join('\n');

        content = content.replace(
            /(# START SECTION Product modules)[\s\S]*?(.*# END SECTION)/,
            `$1\n${newContent}\n$2`
        );
        return content;
    },

    'tsconfig.json': (config, content) => {
        const { modules } = config;
        const existingPaths = content ? jsonc.parse(content).compilerOptions?.paths ?? {} : {};
        const paths = modules.map(({ name }) => [`modules/${name}/*`, [`./${name}/public/*`]]);
        const mergedPaths = { ...existingPaths, ...Object.fromEntries(paths) };

        const edit = jsonc.modify(content, ['compilerOptions', 'paths'], mergedPaths, {
            formattingOptions: { insertSpaces: true }
        });

        // Normalise paths whitespace formatting
        // ENH: handle path arrays that span multiple lines
        edit[0].content = edit[0].content.replaceAll(/\[\s*/g, '[').replaceAll(/\s*\]/g, ']');

        return jsonc.applyEdits(content, edit);
    },

    '.devcontainer/dockerfile': (config, content) => {
        const { platform } = config;

        content = replaceModuleInjection(content, config, true);
        content = replaceOptionalDeps(content, platform.devenv, 'dev');
        content = replaceFetchPipPackages(content, platform.devenv);

        return content.replace(/platform-devenv(.*):.*/, `platform-devenv$1:${platform.version}`);
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
            .replace(/\${PROJ_PREFIX(?::-[^}]*)?}/g, `\${PROJ_PREFIX:-${prefix}}`)
            .replace(/\${MYW_DB_NAME(?::-[^}]*)?}/g, `\${MYW_DB_NAME:-${db_name}}`)
            .replace(/iqgeo_.*_devserver:/, `iqgeo_${prefix}_devserver:`);
    },

    '.devcontainer/remote_host/docker-compose.yml': (config, content) =>
        content.replace(/\${PROJ_PREFIX(?::-[^}]*)?}/g, `\${PROJ_PREFIX:-${config.prefix}}`),

    '.devcontainer/remote_host/docker-compose-shared.yml': (config, content) =>
        content.replace(/\${PROJ_PREFIX(?::-[^}]*)?}/g, `\${PROJ_PREFIX:-${config.prefix}}`),

    '.devcontainer/.env.example': (config, content) => {
        const { prefix, db_name } = config;

        return content
            .replace(/PROJ_PREFIX=.*\n/, `PROJ_PREFIX=${prefix}\n`)
            .replace(/MYW_DB_NAME=.*\n/, `MYW_DB_NAME=${db_name}\n`);
    },

    '.devcontainer/devcontainer.json': (config, content) => {
        const { prefix, display_name } = config;

        // ENH: use jsonc-parser to replace these values
        return content
            .replace(/\"name\": \".*\"/, `"name": "${display_name}"`)
            .replace(
                /"service": "iqgeo_(.*?)_devserver"/,
                `"service": "iqgeo_${prefix}_$1_devserver"`
            );
    },

    '.devcontainer/remote_host/devcontainer.json': (config, content) => {
        const { display_name } = config;

        // ENH: use jsonc-parser to replace these values
        return content.replace(/\"name\": \".*\"/, `"name": "${display_name} (Remote)"`);
    },

    'deployment/dockerfile.build': (config, content) => {
        const { platform } = config;

        return replaceModuleInjection(content, config).replace(
            /platform-build:\S+/g,
            `platform-build:${platform.version}`
        );
    },

    'deployment/dockerfile.appserver': (config, content) => {
        const { modules, platform, prefix } = config;

        content = replaceOptionalDeps(content, platform.appserver, 'build');
        content = replaceOptionalDeps(content, platform.appserver, 'runtime');
        content = replaceFetchPipPackages(content, platform.appserver);

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

        return content
            .replace(
                /(# START SECTION Copy modules.*)[\s\S]*?(# END SECTION)/,
                `$1\n${section2}\n$2`
            )
            .replace(/(?<=FROM )iqgeo-.*-build(?= AS)/i, `iqgeo-${prefix}-build`);
    },

    'deployment/dockerfile.tools': (config, content) => {
        const { platform, prefix } = config;

        content = replaceOptionalDeps(content, platform.tools, 'build');
        content = replaceOptionalDeps(content, platform.tools, 'runtime');

        return content
            .replace(/platform-tools:\S+/g, `platform-tools:${platform.version}`)
            .replace(/(?<=FROM )iqgeo-.*-build(?= AS)/i, `iqgeo-${prefix}-build`);
    },

    'deployment/README.md': (config, content) => {
        const { prefix } = config;

        return content.replace(/ -t iqgeo-.*-(build|tools)\n/g, ` -t iqgeo-${prefix}-$1\n`);
    },

    'deployment/docker-compose.yml': (config, content) => {
        const { prefix, db_name } = config;

        return content
            .replace(/\${PROJ_PREFIX(?::-[^}]*)?}/g, `\${PROJ_PREFIX:-${prefix}}`)
            .replace(/\${MYW_DB_NAME(?::-[^}]*)?}/g, `\${MYW_DB_NAME:-${db_name}}`);
    },

    'deployment/.env.example': (config, content) => {
        const { prefix, db_name } = config;

        return content
            .replace(/PROJ_PREFIX=.*\n/, `PROJ_PREFIX=${prefix}\n`)
            .replace(/MYW_DB_NAME=.*\n/, `MYW_DB_NAME=${db_name}\n`);
    },

    '.devcontainer/entrypoint.d/500_anywhere_setup.sh': (config, content) => {
        const { modules } = config;

        const section1 = modules
            .map(({ name }) => `mkdir -p /opt/iqgeo/anywhere/modules/${name}`)
            .join('\n');
        const section2 = modules
            .map(
                ({ name }) =>
                    `cp -r /opt/iqgeo/platform/WebApps/myworldapp/modules/${name}/public/* /opt/iqgeo/anywhere/modules/${name}/`
            )
            .join('\n');

        return content
            .replace(
                /(# START SECTION - make directory for bundles.*)[\s\S]*?(# END SECTION)/,
                `$1\n${section1}\n$2`
            )
            .replace(
                /(# START SECTION - copy bundles to docker volumes.*)[\s\S]*?(# END SECTION)/,
                `$1\n${section2}\n$2`
            );
    },

    'deployment/entrypoint.d/600_init_db.sh': initDbModifier,
    'deployment/entrypoint.d/610_upgrade_db.sh': upgradeDbModifier,
    '.devcontainer/entrypoint.d/600_init_db.sh': initDbModifier,
    '.devcontainer/entrypoint.d/610_upgrade_db.sh': upgradeDbModifier
};

// Helpers

/**
 * @param {string} content
 * @param {Config} config
 * @param {boolean} [isDevEnv=false]
 * @returns {string}
 */
function replaceModuleInjection(content, config, isDevEnv = false) {
    const { modules, version } = config;
    /** @type {(module: Module) => boolean} */
    const isFromInjectorFn = ({ version, devSrc }) => !!version && !devSrc;
    /** @type {(module: Module) => boolean} */
    const fromAsFilter = isDevEnv
        ? isFromInjectorFn
        : ({ version, devOnly }) => !!version && !devOnly;

    // use new registry paths only if version in jsonc file is higher than 0.6.0
    const isNewRegistry = version !== undefined && semver.gt(version, '0.6.0');

    /** @type {(module: Module) => string} */
    const fromStatement = ({ name, version, registryProject }) => {
        const registryPath = isNewRegistry
            ? `\${PRODUCT_REGISTRY}${registryProject}/`
            : `\${CONTAINER_REGISTRY}`;
        return `FROM ${registryPath}${name}:${version} AS ${name}`;
    };

    const section1 = modules.filter(fromAsFilter).map(fromStatement).join('\n');

    const replacedContent = content.replace(
        /(# START SECTION Aliases for Injector images.*)[\s\S]*?(# END SECTION)/,
        `$1\n${section1}\n$2`
    );

    /** @type {(module: Module) => boolean} */
    const copyFilter = isDevEnv ? isFromInjectorFn : ({ devOnly }) => !devOnly;

    const section2 = modules
        .filter(copyFilter)
        .map(({ name, version }) =>
            version
                ? `COPY --from=${name} / \${MODULES}/`
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
 * @param {string[]} optionalDeps=[]
 * @param {keyof typeof aptGetMappings} type
 * @returns {string}
 */
function replaceOptionalDeps(content, optionalDeps, type) {
    const aptGets = optionalDeps
        // @ts-ignore
        .map(name => aptGetMappings[type][name] ?? [])
        .flat()
        .join(' ');
    const section1 = aptGets
        ? `RUN apt-get update && \\\n    apt-get install -y ${aptGets} \\\n    && apt-get autoremove && apt-get clean`
        : '';

    const typeMatch = type === 'dev' ? '\\(.*' : `\\(${type}.*`; // to handle older versions of the dev file
    const regexp = new RegExp(
        `(# START SECTION optional dependencies ${typeMatch})[\\s\\S]*?(# END SECTION)`
    );
    content = content.replace(regexp, `$1\n${section1}\n$2`);

    return content;
}

/**
 * @param {string} content
 * @param {string[]} [optionalDeps=[]]
 * @returns {string}
 */
function replaceFetchPipPackages(content, optionalDeps = []) {
    const includeValue = optionalDeps
        .map(name => pipPackagesMappings[name] ?? name)
        .flat()
        .join(' ');
    content = content.replace(
        /(RUN myw_product fetch pip_packages.*)/,
        optionalDeps?.length
            ? `RUN myw_product fetch pip_packages --include ${includeValue}`
            : 'RUN myw_product fetch pip_packages'
    );
    return content;
}

//merge build and runtime into dev
const keys = [
    ...new Set([...Object.keys(aptGetMappings.build), ...Object.keys(aptGetMappings.runtime)])
];
aptGetMappings.dev = keys.reduce((acc, key) => {
    acc[key] = [
        // @ts-ignore
        ...new Set([...(aptGetMappings.build[key] ?? []), ...(aptGetMappings.runtime[key] ?? [])])
    ];
    return acc;
}, /** @type {Record<string, any>} */ ({}));

// Types

/**
 * @typedef {import("../typedef.js").Platform} Platform
 * @typedef {import("../typedef.js").Module} Module
 * @typedef {import("../typedef.js").Config} Config
 * @typedef {import("../typedef.js").Transformer} Transformer
 * @typedef {import("../typedef.js").TemplateFilePath} TemplateFilePath
 */
