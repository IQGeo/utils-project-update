import { jsonc } from 'jsonc';
import fs from 'node:fs';
import path from 'node:path';

import { fileTransformers } from './transform.js';

/**
 * Updates a IQGeo project.
 *
 * Project structure should be as per https://github.com/IQGeo/utils-project-template with
 * a `.iqgeorc.jsonc` configuration file at `root`.
 *
 * @param {UpdateOptions} options
 */
export function update({
    root = process.cwd(),
    progress = {
        log: (level, info) => console.log(info),
        warn: (level, info) => console.warn(info),
        error: (level, info) => console.error(info)
    }
}) {
    let config;

    try {
        config = readConfig(root);
    } catch (e) {
        progress.error(1, 'Failed to read configuration file');

        return;
    }

    try {
        const allUpdated = updateFiles(root, config, progress);

        if (allUpdated) {
            progress.log(1, 'IQGeo project configured successfully!');
        } else {
            progress.warn(1, 'IQGeo project configured with warnings');
        }
    } catch (e) {
        progress.error(1, 'Failed to update files');
        progress.error(3, e);
    }
}

//TBR: remove when modules can specify their own optional system dependencies
/** @type {Record<string, Dependencies> } */
const additionalModuleDependencies = {
    network_revenue_optimizer: { appserver: [], tools: ['osm'] }
};

//schema version names for modules are not consistently named, so we need a mapping
/** @type {Record<string, string> } */
const moduleSchemaVersionNames = {
    capture: 'capture_schema',
    workflow_manager: 'mywmywwfm_schema',
    survey: 'mywis_schema',
    gas: 'mywgas_schema',
    electric: 'iqg_electric_schema',
    comms: 'myw_comms_schema',
    comsof: 'iqg_comsof_schema',
    comms_cloud: 'iqg_comms_cloud_schema',
    network_revenue_optimizer: 'mywnro_schema',
    pia_interface: 'myw_pia_schema'
};

/**
 * @param {string} root
 * @returns {Config}
 */
function readConfig(root) {
    const configFilePath = path.join(root, '.iqgeorc.jsonc');
    const configFile = fs.readFileSync(configFilePath, 'utf8');
    /** @type {Config} */
    const config = jsonc.parse(configFile);

    if (!config.registry) {
        config.registry = 'harbor.delivery.iqgeo.cloud/releases';
    }
    if (!config.platform.devenv) config.platform.devenv = [];
    if (!config.platform.appserver) config.platform.appserver = [];
    if (!config.platform.tools) config.platform.tools = [];

    for (const module of config.modules) {
        if (module.version && !module.shortVersion) {
            module.shortVersion = module.version.replaceAll('.', '');
        }

        if (!module.version && !module.devSrc) module.devSrc = module.name;

        //TBR: remove when modules can specify their own optional system dependencies
        const addDep = additionalModuleDependencies[module.name];
        if (addDep) {
            config.platform.devenv.push(...addDep.appserver, ...addDep.tools);
            config.platform.tools.push(...addDep.tools);
            config.platform.appserver.push(...addDep.appserver);
        }

        //TBR: remove when modules can specify their schema version name
        module.schemaVersionName =
            module.schemaVersionName ?? moduleSchemaVersionNames[module.name];
        if (module.dbInit === true && !module.schemaVersionName)
            module.schemaVersionName = `${module.name}_schema`;
    }

    return config;
}

/**
 * @param {string} root
 * @param {Config} config
 * @param {ProgressHandler} progress
 */
function getFileUpdater(root, config, progress) {
    /**
     * @param {string} relPath
     * @param {Transformer} transform
     */
    return (relPath, transform) => {
        const filePath = path.join(root, relPath);

        let content;

        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            progress.warn(2, `Failed to read file ${filePath}`);

            return false;
        }

        content = transform(config, content);

        if (!content) throw new Error('transform returned empty content');

        fs.writeFileSync(filePath, content);

        return true;
    };
}

/**
 * @param {string} root
 * @param {Config} config
 * @param {ProgressHandler} progress
 * @returns {boolean} Whether all files were updated successfully
 */
function updateFiles(root, config, progress) {
    const fileUpdater = getFileUpdater(root, config, progress);

    const results = Object.entries(fileTransformers).map(([relPath, transform]) => {
        try {
            return fileUpdater(relPath, transform);
        } catch (e) {
            progress.warn(2, `Failed to update file ${relPath}`);
            progress.error(3, e);

            return e;
        }
    });

    return !results.some(res => res === false);
}

/**
 * @typedef {import("./typedef.js").Platform} Platform
 * @typedef {import("./typedef.js").Module} Module
 * @typedef {import("./typedef.js").Config} Config
 * @typedef {import("./typedef.js").Transformer} Transformer
 * @typedef {import("./typedef.js").ProgressHandler} ProgressHandler
 * @typedef {import("./typedef.js").UpdateOptions} UpdateOptions
 * @typedef {import("./typedef.js").Dependencies} Dependencies
 */
