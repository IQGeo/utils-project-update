/**
 * @typedef {{version: string} & Required<Dependencies>} Platform
 */

/**
 * @typedef Module
 * @property {string} name
 * @property {string} [version]
 * @property {boolean} [devOnly]
 * @property {string} [devSrc]
 * @property {boolean} [dbInit]
 * @property {string} [schemaVersionName]
 * @property {string} [shortVersion]
 */

/**
 * @typedef Config
 * @property {string} [name]
 * @property {string} [display_name]
 * @property {string} [prefix]
 * @property {string} [db_name]
 * @property {string} [registry]
 * @property {Platform} platform
 * @property {Module[]} modules
 */

/**
 * @typedef {(config: Config, content: string) => string} Transformer
 */

/**
  @typedef {
    '.gitignore' |
    '.devcontainer/dockerfile' |
    '.devcontainer/docker-compose.yml' |
    '.devcontainer/.env.example' |
    '.devcontainer/devcontainer.json' |
    '.devcontainer/entrypoint.d/270_adjust_oidc_conf.sh' |
    '.devcontainer/entrypoint.d/600_init_db.sh' |
    '.devcontainer/entrypoint.d/850_fetch.sh' |
    '.devcontainer/devserver_config/oidc/conf.json' |
    '.devcontainer/remote_host/devcontainer.json' |
    '.devcontainer/remote_host/dockerfile' |
    '.devcontainer/remote_host/docker-compose.yml' |
    '.devcontainer/remote_host/docker-compose-shared.yml' |
    'deployment/dockerfile.build' |
    'deployment/dockerfile.appserver' |
    'deployment/dockerfile.tools' |
    'deployment/docker-compose.yml' |
    'deployment/.env.example' |
    'deployment/entrypoint.d/270_adjust_oidc_conf.sh' |
    'deployment/entrypoint.d/600_init_db.sh' |
    'deployment/appserver_config/oidc/conf.json'
  } TransformFile
 */

/**
 * @typedef {object} ProgressHandler
 * @property {(level: number, info: any, moreDetails?: any) => void} log
 * @property {(level: number, info: any, moreDetails?: any) => void} warn
 * @property {(level: number, info: any, moreDetails?: any) => void} error
 */

/**
 * @typedef {object} UpdateOptions
 * @property {string} [root=process.cwd()] The root directory of the project
 * @property {ProgressHandler} [progress] Functions used to output progress logs (defaults to `console.{log,warn,error}`)
 */

/**
 * @typedef {Omit<UpdateOptions, 'progress'>} UpdateOptionsCLI
 */

/**
 * @typedef {object} PullOptions
 * @property {string} [out='./utils-project-template'] The output directory for all template files and folders (defaults to `'./utils-project-template'`)
 * @property {ProgressHandler} [progress] Functions used to output progress logs (defaults to `console.{log,warn,error}`)
 */

/**
 * @typedef {Omit<PullOptions, 'progress'>} PullOptionsCLI
 */

/**
 * @typedef Dependencies
 * @property {string[]} appserver
 * @property {string[]} tools
 * @property {string[]} [devenv]
 */

export {};
