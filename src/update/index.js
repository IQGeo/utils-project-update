import fs from 'node:fs';
import path from 'node:path';

import { readConfig } from '../config.js';

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
} = {}) {
    let config;

    try {
        config = readConfig(root);
    } catch (e) {
        progress.error(1, 'Failed to read configuration file', e);

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
        progress.error(1, 'Failed to update files', e);
    }
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
        // check if path matches any of the excludes patterns
        const excludes = config.exclude_file_paths ?? [];
        if (excludes.some(exclude => new RegExp(exclude).test(relPath))) return;

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
            progress.warn(2, `Failed to update file ${relPath}`, e);

            return e;
        }
    });

    return !results.some(res => res === false);
}

/**
 * @typedef {import("../typedef.js").Platform} Platform
 * @typedef {import("../typedef.js").Module} Module
 * @typedef {import("../typedef.js").Config} Config
 * @typedef {import("../typedef.js").Transformer} Transformer
 * @typedef {import("../typedef.js").ProgressHandler} ProgressHandler
 * @typedef {import("../typedef.js").UpdateOptions} UpdateOptions
 */
