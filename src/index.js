import { jsonc } from 'jsonc';
import fs from 'node:fs';
import path from 'node:path';

import { fileTransformers } from './transform.js';

/**
 * Updates a IQGeo project.
 *
 * Project structure should be as per https://github.com/IQGeo/utils-project-template with
 * a `.iqgeorc.jsonc` configuration file at `root`.
 */
export function update(root = process.cwd()) {
    let config;

    try {
        config = readConfig(root);
    } catch (e) {
        console.error('Failed to read configuration file');

        return;
    }

    try {
        const allUpdated = updateFiles(root, config);

        if (allUpdated) {
            console.log('IQGeo project configured successfully!');
        } else {
            console.warn('IQGeo project configured with warnings');
        }
    } catch (e) {
        console.error('Failed to update files');
        console.error(e);
    }
}

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

    for (const module of config.modules) {
        if (module.version && !module.shortVersion) {
            module.shortVersion = module.version.replaceAll('.', '');
        }

        if (!module.version && !module.devSrc) {
            module.devSrc = module.name;
        }
    }

    return config;
}

/**
 * @param {string} root
 * @param {Config} config
 */
function getFileUpdater(root, config) {
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
            console.warn(`Failed to read file ${filePath}`);

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
 * @returns {boolean} Whether all files were updated successfully
 */
function updateFiles(root, config) {
    const fileUpdater = getFileUpdater(root, config);

    const results = Object.entries(fileTransformers).map(([relPath, transform]) => {
        try {
            return fileUpdater(relPath, transform);
        } catch (e) {
            console.warn(`Failed to update file ${relPath}`);
            console.error(e);

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
 */
