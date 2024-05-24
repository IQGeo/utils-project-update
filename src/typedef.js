/**
 * @typedef Platform
 * @property {string} [version]
 * @property {string[]} [devenv]
 * @property {string[]} [appserver]
 * @property {string[]} [tools]
 */

/**
 * @typedef Module
 * @property {string} name
 * @property {string} [version]
 * @property {boolean} [devOnly]
 * @property {string} [devSrc]
 * @property {boolean} [dbInit]
 * @property {string} [schemaGrep]
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
