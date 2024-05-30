/**
 * @typedef {Dependencies} Platform
 * @property {string} version
 * @property {string[]} devenv
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
 * @typedef {object} ProgressHandler
 * @property {(level: number, info: any) => void} log
 * @property {(level: number, info: any) => void} warn
 * @property {(level: number, info: any) => void} error
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
