import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { update } from '../src/update/index.js';

describe('update', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    function writeConfig(config) {
        const content = JSON.stringify(config);
        fs.writeFileSync(path.join(tmpDir, '.iqgeorc.jsonc'), content);
    }

    function writeFile(relPath, content) {
        const filePath = path.join(tmpDir, relPath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
    }

    it('calls progress.error when config file is missing', () => {
        const progress = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };

        update({ root: tmpDir, progress });

        expect(progress.error).toHaveBeenCalledWith(
            1,
            'Failed to read configuration file',
            expect.anything()
        );
    });

    it('updates .gitignore from config', () => {
        writeConfig({
            version: '0.7.0',
            prefix: 'test',
            db_name: 'testdb',
            platform: { version: '7.0.0', devenv: [], appserver: [], tools: [] },
            modules: [
                { name: 'comms', version: '7.0.0' },
                { name: 'mymod' }
            ]
        });

        writeFile(
            '.gitignore',
            'node_modules\n# START SECTION Product modules\n/old\n# END SECTION\n'
        );

        const progress = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
        update({ root: tmpDir, progress });

        const result = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
        expect(result).toContain('/comms');
        expect(result).toContain('/dev_tools');
        expect(result).toContain('/custom');
        expect(result).not.toContain('/old');
    });

    it('reports success via progress.log', () => {
        writeConfig({
            version: '0.7.0',
            prefix: 'test',
            db_name: 'testdb',
            platform: { version: '7.0.0', devenv: [], appserver: [], tools: [] },
            modules: []
        });

        const progress = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
        update({ root: tmpDir, progress });

        // Should log success (may also warn about missing files)
        expect(progress.error).not.toHaveBeenCalled();
    });

    it('respects exclude_file_paths configuration', () => {
        writeConfig({
            version: '0.7.0',
            prefix: 'test',
            db_name: 'testdb',
            platform: { version: '7.0.0', devenv: [], appserver: [], tools: [] },
            modules: [],
            exclude_file_paths: ['\\.gitignore']
        });

        writeFile(
            '.gitignore',
            'node_modules\n# START SECTION Product modules\n/should_remain\n# END SECTION\n'
        );

        const progress = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
        update({ root: tmpDir, progress });

        const result = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
        expect(result).toContain('/should_remain');
    });

    it('warns when a file cannot be read', () => {
        writeConfig({
            version: '0.7.0',
            prefix: 'test',
            db_name: 'testdb',
            platform: { version: '7.0.0', devenv: [], appserver: [], tools: [] },
            modules: []
        });
        // Don't create any files that the transformers expect

        const progress = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
        update({ root: tmpDir, progress });

        // Should warn about missing files but not error
        expect(progress.warn).toHaveBeenCalled();
        expect(progress.error).not.toHaveBeenCalled();
    });
});
