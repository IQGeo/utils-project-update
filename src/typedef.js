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
 * @property {boolean} [isExternal] Whether the module is external (i.e. not part of the project)
 * @property {string} [registryProject]
 */

/**
 * @typedef Deployment
 * @property {string} [project_registry]
 */

/**
 * @typedef Config
 * @property {string} [name]
 * @property {string} [display_name]
 * @property {string} prefix
 * @property {string} [db_name]
 * @property {string} [registry]
 * @property {Deployment} [deployment]
 * @property {Platform} platform
 * @property {Module[]} modules
 * @property {string[]} [exclude_file_paths]
 * @property {string} version
 */

/**
 * @typedef {(config: Config, content: string) => string} Transformer
 */

/**
  @typedef {
    '.gitignore' |
    'tsconfig.json' |
    '.devcontainer/dockerfile' |
    '.devcontainer/docker-compose.yml' |
    '.devcontainer/.env.example' |
    '.devcontainer/devcontainer.json' |
    '.devcontainer/entrypoint.d/270_adjust_oidc_conf.sh' |
    '.devcontainer/entrypoint.d/600_init_db.sh' |
    '.devcontainer/entrypoint.d/610_upgrade_db.sh' |
    '.devcontainer/entrypoint.d/850_fetch.sh' |
    '.devcontainer/entrypoint.d/500_anywhere_setup.sh' |
    '.devcontainer/devserver_config/oidc/conf.json' |
    '.devcontainer/remote_host/devcontainer.json' |
    '.devcontainer/remote_host/dockerfile' |
    '.devcontainer/remote_host/docker-compose.yml' |
    '.devcontainer/remote_host/docker-compose-shared.yml' |
    '.vscode/tasks.json' |
    'deployment/dockerfile.build' |
    'deployment/dockerfile.appserver' |
    'deployment/dockerfile.tools' |
    'deployment/README.md' |
    'deployment/docker-compose.yml' |
    'deployment/.env.example' |
    'deployment/build_images.sh' |
    'deployment/helm/values.yaml' |
    'deployment/helm/minikube/minikube_image_load.sh' |
    'deployment/helm/minikube/values-minikube.yaml' |
    'deployment/entrypoint.d/270_adjust_oidc_conf.sh' |
    'deployment/entrypoint.d/600_init_db.sh' |
    'deployment/entrypoint.d/610_upgrade_db.sh' |
    'deployment/appserver_config/oidc/conf.json'
  } TemplateFilePath
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
