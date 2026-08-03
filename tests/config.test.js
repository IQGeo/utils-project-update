import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readConfig } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('readConfig', () => {
    it('reads and parses the config file', () => {
        const config = readConfig(fixturesDir);

        expect(config.prefix).toBe('testproj');
        expect(config.db_name).toBe('testdb');
        expect(config.display_name).toBe('Test Project');
        expect(config.version).toBe('0.7.0');
    });

    it('sets default registry when not specified', () => {
        const config = readConfig(fixturesDir);

        expect(config.registry).toBe('harbor.delivery.iqgeo.cloud/releases');
    });

    it('initializes platform arrays if missing', () => {
        const config = readConfig(fixturesDir);

        expect(config.platform.devenv).toBeInstanceOf(Array);
        expect(config.platform.appserver).toBeInstanceOf(Array);
        expect(config.platform.tools).toBeInstanceOf(Array);
    });

    it('computes shortVersion from module version', () => {
        const config = readConfig(fixturesDir);
        const comms = config.modules.find(m => m.name === 'comms');

        expect(comms.shortVersion).toBe('720');
    });

    it('sets isExternal=true for modules with version', () => {
        const config = readConfig(fixturesDir);
        const comms = config.modules.find(m => m.name === 'comms');
        const custom = config.modules.find(m => m.name === 'custom');

        expect(comms.isExternal).toBe(true);
        expect(custom.isExternal).toBe(false);
    });

    it('sets devSrc to module name when no version and no devSrc', () => {
        const config = readConfig(fixturesDir);
        const custom = config.modules.find(m => m.name === 'custom');

        expect(custom.devSrc).toBe('custom');
    });

    it('maps known module schema version names', () => {
        const config = readConfig(fixturesDir);
        const comms = config.modules.find(m => m.name === 'comms');
        const wfm = config.modules.find(m => m.name === 'workflow_manager');

        expect(comms.schemaVersionName).toBe('myw_comms_schema');
        expect(wfm.schemaVersionName).toBe('mywmywwfm_schema');
    });

    it('maps registryProject from moduleToProjectMapping', () => {
        const config = readConfig(fixturesDir);
        const comms = config.modules.find(m => m.name === 'comms');
        const custom = config.modules.find(m => m.name === 'custom');

        expect(comms.registryProject).toBe('comms');
        expect(custom.registryProject).toBe('custom'); // falls back to module name
    });

    it('adds additional dependencies for network_revenue_optimizer', () => {
        const config = readConfig(fixturesDir);

        // network_revenue_optimizer adds 'osm' to tools and devenv
        expect(config.platform.tools).toContain('osm');
        expect(config.platform.devenv).toContain('osm');
    });

    it('computes requiredServices from module-to-service mapping', () => {
        const config = readConfig(fixturesDir);

        // orchestration_manager requires openbao
        expect(config.requiredServices).toContain('openbao');
        // notification_manager is a child of workflow_manager, not directly listed
        // but workflow_manager doesn't have a service mapping
    });

    it('throws when config file does not exist', () => {
        expect(() => readConfig('/nonexistent/path')).toThrow();
    });
});
