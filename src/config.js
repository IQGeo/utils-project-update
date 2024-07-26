import * as jsonc from 'jsonc-parser';
import fs from 'node:fs';
import path from 'node:path';

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
    mywapp_common: 'mywapp_schema',
    groups: 'groups',
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
export function readConfig(root) {
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
 * @typedef {import("./typedef.js").Config} Config
 * @typedef {import("./typedef.js").Dependencies} Dependencies
 */
