import { describe, expect, it } from 'vitest';

import { fileTransformers } from '../src/update/transform.js';

/** @returns {import('../src/typedef.js').Config} */
function makeConfig(overrides = {}) {
    return {
        prefix: 'myproj',
        db_name: 'mydb',
        display_name: 'My Project',
        version: '0.7.0',
        registry: 'harbor.delivery.iqgeo.cloud/releases',
        platform: {
            version: '7.2.0',
            devenv: [],
            appserver: [],
            tools: []
        },
        modules: [
            {
                name: 'comms',
                version: '7.2.0',
                shortVersion: '720',
                isExternal: true,
                registryProject: 'comms',
                schemaVersionName: 'myw_comms_schema',
                dbInit: true
            },
            {
                name: 'custom',
                devSrc: 'custom',
                isExternal: false,
                registryProject: 'custom'
            }
        ],
        requiredServices: [],
        ...overrides
    };
}

describe('fileTransformers', () => {
    describe('.gitignore', () => {
        it('replaces product modules section with external modules', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION Product modules',
                '/old_module',
                '# END SECTION'
            ].join('\n');

            const result = fileTransformers['.gitignore'](config, content);

            expect(result).toContain('/comms');
            expect(result).toContain('/dev_tools');
            expect(result).not.toContain('/old_module');
        });

        it('adds /custom if not already in modules list', () => {
            const config = makeConfig({
                modules: [
                    { name: 'comms', version: '7.2.0', isExternal: true, registryProject: 'comms' }
                ]
            });
            const content = [
                '# START SECTION Product modules',
                '# END SECTION'
            ].join('\n');

            const result = fileTransformers['.gitignore'](config, content);

            expect(result).toContain('/custom');
        });

        it('does not duplicate /custom if already in modules', () => {
            const config = makeConfig({
                modules: [
                    {
                        name: 'custom',
                        version: '1.0.0',
                        isExternal: true,
                        registryProject: 'custom'
                    }
                ]
            });
            const content = [
                '# START SECTION Product modules',
                '# END SECTION'
            ].join('\n');

            const result = fileTransformers['.gitignore'](config, content);

            const matches = result.match(/\/custom/g);
            expect(matches).toHaveLength(1);
        });
    });

    describe('tsconfig.json', () => {
        it('adds module paths to compilerOptions.paths', () => {
            const config = makeConfig();
            const content = JSON.stringify(
                { compilerOptions: { paths: {} } },
                null,
                4
            );

            const result = fileTransformers['tsconfig.json'](config, content);
            const parsed = JSON.parse(result);

            expect(parsed.compilerOptions.paths['modules/comms/*']).toEqual(['./comms/public/*']);
            expect(parsed.compilerOptions.paths['modules/custom/*']).toEqual([
                './custom/public/*'
            ]);
        });

        it('preserves existing paths', () => {
            const config = makeConfig();
            const content = JSON.stringify(
                { compilerOptions: { paths: { 'existing/*': ['./existing/*'] } } },
                null,
                4
            );

            const result = fileTransformers['tsconfig.json'](config, content);
            const parsed = JSON.parse(result);

            expect(parsed.compilerOptions.paths['existing/*']).toEqual(['./existing/*']);
        });
    });

    describe('.devcontainer/dockerfile', () => {
        it('replaces platform-devenv version', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION Aliases for Injector images',
                '# END SECTION',
                '# START SECTION Copy the modules',
                '# END SECTION',
                'FROM harbor.delivery.iqgeo.cloud/releases/platform-devenv-focal:OLD_VERSION'
            ].join('\n');

            const result = fileTransformers['.devcontainer/dockerfile'](config, content);

            expect(result).toContain('platform-devenv-focal:7.2.0');
            expect(result).not.toContain('OLD_VERSION');
        });

        it('injects module aliases and copy statements', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION Aliases for Injector images',
                '# END SECTION',
                '# START SECTION Copy the modules',
                '# END SECTION',
                'FROM harbor/platform-devenv:1.0.0'
            ].join('\n');

            const result = fileTransformers['.devcontainer/dockerfile'](config, content);

            expect(result).toContain('FROM ${PRODUCT_REGISTRY}comms/comms:7.2.0 AS comms');
            expect(result).toContain('COPY --from=comms / ${MODULES}/');
        });
    });

    describe('.devcontainer/docker-compose.yml', () => {
        it('replaces PROJ_PREFIX and MYW_DB_NAME', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION',
                '# END SECTION',
                'PROJ_PREFIX: ${PROJ_PREFIX:-old}',
                'MYW_DB_NAME: ${MYW_DB_NAME:-old}',
                'iqgeo_old_devserver:'
            ].join('\n');

            const result = fileTransformers['.devcontainer/docker-compose.yml'](config, content);

            expect(result).toContain('${PROJ_PREFIX:-myproj}');
            expect(result).toContain('${MYW_DB_NAME:-mydb}');
            expect(result).toContain('iqgeo_myproj_devserver:');
        });

        it('injects local module volume mounts', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION',
                '            - old_mount',
                '# END SECTION',
                '${PROJ_PREFIX:-x}',
                '${MYW_DB_NAME:-x}',
                'iqgeo_x_devserver:'
            ].join('\n');

            const result = fileTransformers['.devcontainer/docker-compose.yml'](config, content);

            // custom module has devSrc so should appear as volume mount
            expect(result).toContain(
                '../custom:/opt/iqgeo/platform/WebApps/myworldapp/modules/custom:delegated'
            );
            expect(result).not.toContain('old_mount');
        });
    });

    describe('.devcontainer/.env.example', () => {
        it('replaces PROJ_PREFIX and MYW_DB_NAME', () => {
            const config = makeConfig();
            const content = 'PROJ_PREFIX=old\nMYW_DB_NAME=olddb\n';

            const result = fileTransformers['.devcontainer/.env.example'](config, content);

            expect(result).toContain('PROJ_PREFIX=myproj');
            expect(result).toContain('MYW_DB_NAME=mydb');
        });
    });

    describe('.devcontainer/devcontainer.json', () => {
        it('replaces name and service', () => {
            const config = makeConfig();
            const content = `{
    "name": "Old Name",
    "service": "iqgeo_focal_devserver"
}`;

            const result = fileTransformers['.devcontainer/devcontainer.json'](config, content);

            expect(result).toContain('"name": "My Project"');
            expect(result).toContain('"service": "iqgeo_myproj_focal_devserver"');
        });
    });

    describe('deployment/dockerfile.build', () => {
        it('replaces platform-build version and injects modules', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION Aliases for Injector images',
                '# END SECTION',
                '# START SECTION Copy the modules',
                '# END SECTION',
                'FROM harbor/platform-build:OLD'
            ].join('\n');

            const result = fileTransformers['deployment/dockerfile.build'](config, content);

            expect(result).toContain('platform-build:7.2.0');
            expect(result).not.toContain('platform-build:OLD');
        });

        it('uses ${VERSION} for product modules without explicit version', () => {
            const config = makeConfig({
                modules: [
                    { name: 'myproduct', type: 'product', isExternal: true, registryProject: 'myproduct' }
                ]
            });
            const content = [
                '# START SECTION Aliases for Injector images',
                '# END SECTION',
                '# START SECTION Copy the modules',
                '# END SECTION',
                'FROM harbor/platform-build:OLD'
            ].join('\n');

            const result = fileTransformers['deployment/dockerfile.build'](config, content);

            expect(result).toContain('ARG VERSION');
            expect(result).toContain('FROM ${PRODUCT_REGISTRY}myproduct/myproduct:${VERSION} AS myproduct');
            expect(result).toContain('COPY --from=myproduct / ${MODULES}/');
        });

        it('does not add ARG VERSION when no product modules exist', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION Aliases for Injector images',
                '# END SECTION',
                '# START SECTION Copy the modules',
                '# END SECTION',
                'FROM harbor/platform-build:OLD'
            ].join('\n');

            const result = fileTransformers['deployment/dockerfile.build'](config, content);

            expect(result).not.toContain('ARG VERSION');
        });

        it('product modules with explicit version use that version instead of ${VERSION}', () => {
            const config = makeConfig({
                modules: [
                    { name: 'myproduct', type: 'product', version: '2.0.0', isExternal: true, registryProject: 'myproduct' }
                ]
            });
            const content = [
                '# START SECTION Aliases for Injector images',
                '# END SECTION',
                '# START SECTION Copy the modules',
                '# END SECTION',
                'FROM harbor/platform-build:OLD'
            ].join('\n');

            const result = fileTransformers['deployment/dockerfile.build'](config, content);

            expect(result).toContain('FROM ${PRODUCT_REGISTRY}myproduct/myproduct:2.0.0 AS myproduct');
            expect(result).toContain('COPY --from=myproduct / ${MODULES}/');
        });

        it('excludes devOnly product modules from build Dockerfile', () => {
            const config = makeConfig({
                modules: [
                    { name: 'devtool', type: 'product', devOnly: true, isExternal: true, registryProject: 'devtool' }
                ]
            });
            const content = [
                '# START SECTION Aliases for Injector images',
                '# END SECTION',
                '# START SECTION Copy the modules',
                '# END SECTION',
                'FROM harbor/platform-build:OLD'
            ].join('\n');

            const result = fileTransformers['deployment/dockerfile.build'](config, content);

            expect(result).not.toContain('devtool');
            expect(result).not.toContain('ARG VERSION');
        });

        it('product modules without version are not treated as FROM in dev environment', () => {
            const config = makeConfig({
                modules: [
                    { name: 'myproduct', type: 'product', devSrc: 'myproduct', isExternal: true, registryProject: 'myproduct' }
                ]
            });
            const content = [
                '# START SECTION Aliases for Injector images',
                '# END SECTION',
                '# START SECTION Copy the modules',
                '# END SECTION',
                'FROM harbor/platform-devenv:7.2.0'
            ].join('\n');

            const result = fileTransformers['.devcontainer/dockerfile'](config, content);

            // In dev, product modules without version should not get a FROM or ARG VERSION
            expect(result).not.toContain('FROM ${PRODUCT_REGISTRY}myproduct/myproduct');
            expect(result).not.toContain('ARG VERSION');
            // No COPY --from either (module is volume-mounted in dev)
            expect(result).not.toContain('COPY --from=myproduct');
        });
    });

    describe('deployment/dockerfile.appserver', () => {
        it('replaces platform-appserver version', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION optional dependencies (build)',
                '# END SECTION',
                '# START SECTION optional dependencies (runtime)',
                '# END SECTION',
                '# START SECTION Copy modules',
                '# END SECTION',
                'RUN myw_product fetch pip_packages',
                'FROM harbor/platform-appserver:OLD',
                'FROM iqgeo-old-build AS builder',
                'iqgeo-old-build',
                'PROJECT_REGISTRY=old_reg',
                'PROJECT_REPOSITORY=old_repo'
            ].join('\n');

            const result = fileTransformers['deployment/dockerfile.appserver'](config, content);

            expect(result).toContain('platform-appserver:7.2.0');
            expect(result).toContain('FROM iqgeo-myproj-build AS builder');
        });

        it('generates COPY statements for non-devOnly modules', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION optional dependencies (build)',
                '# END SECTION',
                '# START SECTION optional dependencies (runtime)',
                '# END SECTION',
                '# START SECTION Copy modules',
                '# END SECTION',
                'RUN myw_product fetch pip_packages',
                'FROM harbor/platform-appserver:7.2.0',
                'FROM iqgeo-old-build AS builder',
                'iqgeo-old-build',
                'PROJECT_REGISTRY=',
                'PROJECT_REPOSITORY='
            ].join('\n');

            const result = fileTransformers['deployment/dockerfile.appserver'](config, content);

            expect(result).toContain(
                'COPY --chown=www-data:www-data --from=iqgeo_builder ${MODULES}/comms/ ${MODULES}/comms/'
            );
            expect(result).toContain(
                'COPY --chown=www-data:www-data --from=iqgeo_builder ${MODULES}/custom/ ${MODULES}/custom/'
            );
        });
    });

    describe('deployment/docker-compose.yml', () => {
        it('replaces prefix and db_name variables', () => {
            const config = makeConfig();
            const content = [
                '${PROJ_PREFIX:-old}',
                '${MYW_DB_NAME:-old}',
                '${PROJECT_REGISTRY:-old}',
                '${PROJECT_REPOSITORY:-old}'
            ].join('\n');

            const result = fileTransformers['deployment/docker-compose.yml'](config, content);

            expect(result).toContain('${PROJ_PREFIX:-myproj}');
            expect(result).toContain('${MYW_DB_NAME:-mydb}');
        });
    });

    describe('deployment/.env.example', () => {
        it('replaces environment variables', () => {
            const config = makeConfig({ deployment: { project_registry: 'reg', project_repository: 'repo' } });
            const content = 'PROJ_PREFIX=old\nMYW_DB_NAME=old\nPROJECT_REGISTRY=old\nPROJECT_REPOSITORY=old';

            const result = fileTransformers['deployment/.env.example'](config, content);

            expect(result).toContain('PROJ_PREFIX=myproj');
            expect(result).toContain('MYW_DB_NAME=mydb');
            expect(result).toContain('PROJECT_REGISTRY=reg');
            expect(result).toContain('PROJECT_REPOSITORY=repo');
        });
    });

    describe('entrypoint.d/600_init_db.sh', () => {
        it('generates db init commands for modules with dbInit and schemaVersionName', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION db init',
                'old content',
                '# END SECTION'
            ].join('\n');

            const result =
                fileTransformers['deployment/entrypoint.d/600_init_db.sh'](config, content);

            expect(result).toContain('myw_db $MYW_DB_NAME install comms');
            expect(result).toContain('grep myw_comms_schema');
            expect(result).not.toContain('old content');
        });

        it('skips modules without schemaVersionName', () => {
            const config = makeConfig({
                modules: [{ name: 'noschema', version: '1.0', dbInit: true, isExternal: true }]
            });
            const content = '# START SECTION db init\n# END SECTION';

            const result =
                fileTransformers['deployment/entrypoint.d/600_init_db.sh'](config, content);

            expect(result).not.toContain('install noschema');
        });
    });

    describe('entrypoint.d/610_upgrade_db.sh', () => {
        it('generates db upgrade commands', () => {
            const config = makeConfig();
            const content = [
                '# START SECTION db upgrade',
                'old content',
                '# END SECTION'
            ].join('\n');

            const result =
                fileTransformers['deployment/entrypoint.d/610_upgrade_db.sh'](config, content);

            expect(result).toContain('myw_db $MYW_DB_NAME upgrade comms');
            expect(result).toContain('grep myw_comms_schema');
        });

        it('adds colon prefix when section is empty (no modules with db)', () => {
            const config = makeConfig({
                modules: [{ name: 'nodeps', isExternal: false, devSrc: 'nodeps' }]
            });
            const content = '# START SECTION db upgrade\n# END SECTION';

            const result =
                fileTransformers['deployment/entrypoint.d/610_upgrade_db.sh'](config, content);

            // Should have a colon as no-op when empty
            expect(result).toMatch(/# START SECTION db upgrade\n:\n# END SECTION/);
        });
    });

    describe('deployment/build_images.sh', () => {
        it('replaces PROJ_PREFIX and deployment vars', () => {
            const config = makeConfig({
                deployment: { project_registry: 'myreg', project_repository: 'myrepo' }
            });
            const content =
                'PROJ_PREFIX="old"\nPROJECT_REGISTRY="oldreg"\nPROJECT_REPOSITORY="oldrepo"';

            const result = fileTransformers['deployment/build_images.sh'](config, content);

            expect(result).toContain('PROJ_PREFIX="myproj"');
            expect(result).toContain('PROJECT_REGISTRY="myreg"');
            expect(result).toContain('PROJECT_REPOSITORY="myrepo"');
        });
    });

    describe('deployment/values.yaml', () => {
        it('replaces imagePrefix and project vars', () => {
            const config = makeConfig({
                deployment: { project_registry: 'reg', project_repository: 'repo' }
            });
            const content = 'imagePrefix: old\nprojectRegistry: old\nprojectRepository: old\n';

            const result = fileTransformers['deployment/values.yaml'](config, content);

            expect(result).toContain('imagePrefix: myproj');
            expect(result).toContain('projectRegistry: reg');
            expect(result).toContain('projectRepository: repo');
        });
    });
});

describe('enableServices', () => {
    it('removes profiles disabled and adds to depends_on', () => {
        const config = makeConfig({ requiredServices: ['openbao'] });
        const content = [
            'services:',
            '    openbao:',
            "        profiles: ['disabled']",
            '        image: openbao',
            '    iqgeo:',
            '        image: iqgeo',
            '        depends_on:',
            '            - postgres',
            '    other:',
            '        image: other'
        ].join('\n');

        const result = fileTransformers['deployment/docker-compose.yml'](config, content);

        expect(result).not.toContain("profiles: ['disabled']");
        expect(result).toContain('            - openbao');
    });
});
