import fs from 'fs';
import { jsonc } from 'jsonc';
import path from 'path';

import { fileTransformers } from './transform.js';

function fileUpdater(root, config) {
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
    };
}

/**
 * Updates a IQGeo project.
 * Project structure should as per https://github.com/IQGeo/utils-project-template with a .iqgeorc.jsonc configuration file
 */
export class IQGeoProjectUpdate {
    constructor(context) {
        context.subscriptions.push(
            vscode.commands.registerCommand('iqgeo.updateProject', () => this.update())
        );
    }

    /**
     * Updates a IQGeo project based on https://github.com/IQGeo/utils-project-template from the options specified in the .iqgeorc.jsonc configuration file
     */
    async update() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;
        const root = workspaceFolders[0].uri.fsPath;

        let config;
        try {
            config = this._readConfig(root);
        } catch (e) {
            vscode.window.showErrorMessage('Failed to read configuration file');
            return;
        }
        try {
            const allUpdated = this._updateFiles(root, config);
            if (allUpdated)
                vscode.window.showInformationMessage('IQGeo project configured successfully!');
            else vscode.window.showWarningMessage('IQGeo project configured with warnings');
        } catch (e) {
            vscode.window.showErrorMessage('Failed to update files');
            console.error(e);
            return;
        }
    }

    _readConfig(root) {
        const configFilePath = path.join(root, '.iqgeorc.jsonc');
        const configFile = fs.readFileSync(configFilePath, 'utf8');
        const config = jsonc.parse(configFile);
        if (!config.registry) config.registry = 'harbor.delivery.iqgeo.cloud/releases';
        for (const module of config.modules) {
            if (module.version && !module.shortVersion)
                module.shortVersion = module.version.replaceAll('.', '');
            if (!module.version && !module.devSrc) module.devSrc = module.name;
        }
        return config;
    }

    _updateFiles(root, config) {
        const update = fileUpdater(root, config);

        const errors = Object.entries(fileTransformers).map(([relPath, transform]) => {
            try {
                return update(relPath, transform);
            } catch (e) {
                console.warn(`Failed to update file ${relPath}`);
                console.error(e);
                return e;
            }
        });
        return !errors.some(e => e);
    }
}
