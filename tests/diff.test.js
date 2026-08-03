import { describe, expect, it } from 'vitest';

import { compareIqgeorc, mergeCustomSections } from '../src/pull/diff.js';

describe('compareIqgeorc', () => {
    it('returns empty diffs for identical objects', () => {
        const template = { prefix: 'test', version: '1.0.0', platform: { version: '7.0' } };
        const project = { prefix: 'test', version: '1.0.0', platform: { version: '7.0' } };

        const result = compareIqgeorc(project, template);

        expect(result.missingKeys).toEqual([]);
        expect(result.unexpectedKeys).toEqual([]);
        expect(result.typeMismatches).toEqual([]);
    });

    it('detects missing keys in project', () => {
        const template = { prefix: 'test', version: '1.0.0', db_name: 'mydb' };
        const project = { prefix: 'test', version: '1.0.0' };

        const result = compareIqgeorc(project, template);

        expect(result.missingKeys).toContain('db_name');
    });

    it('detects unexpected keys in project', () => {
        const template = { prefix: 'test' };
        const project = { prefix: 'test', extra_key: 'value' };

        const result = compareIqgeorc(project, template);

        expect(result.unexpectedKeys).toContain('extra_key');
    });

    it('detects type mismatches', () => {
        const template = { prefix: 'test', modules: [] };
        const project = { prefix: 'test', modules: 'not_an_array' };

        const result = compareIqgeorc(project, template);

        expect(result.typeMismatches).toContain('modules');
    });

    it('detects nested missing keys', () => {
        const template = { platform: { version: '7.0', appserver: [] } };
        const project = { platform: { version: '7.0' } };

        const result = compareIqgeorc(project, template);

        expect(result.missingKeys).toContain('platform.appserver');
    });

    it('detects nested type mismatches', () => {
        const template = { platform: { version: '7.0', tools: [] } };
        const project = { platform: { version: '7.0', tools: 'string' } };

        const result = compareIqgeorc(project, template);

        expect(result.typeMismatches).toContain('platform.tools');
    });

    it('detects nested unexpected keys', () => {
        const template = { platform: { version: '7.0' } };
        const project = { platform: { version: '7.0', extra: true } };

        const result = compareIqgeorc(project, template);

        expect(result.unexpectedKeys).toContain('platform.extra');
    });
});

describe('mergeCustomSections', () => {
    it('preserves template content when no custom sections exist', () => {
        const template = 'line1\nline2\nline3\n';
        const project = 'line1\nline2\nline3\n';

        const result = mergeCustomSections(template, project);

        expect(result).toBe(template);
    });

    it('preserves custom sections from project into template', () => {
        const template = [
            'before',
            '# START CUSTOM SECTION',
            '# placeholder',
            '# END CUSTOM SECTION',
            'after'
        ].join('\n');

        const project = [
            'before',
            '# START CUSTOM SECTION',
            'my custom content',
            '# END CUSTOM SECTION',
            'after'
        ].join('\n');

        const result = mergeCustomSections(template, project);

        expect(result).toContain('my custom content');
        expect(result).toContain('# START CUSTOM SECTION');
        expect(result).toContain('# END CUSTOM SECTION');
    });

    it('uses // as comment delimiter for jsonc files', () => {
        const template = [
            '{',
            '// START CUSTOM SECTION',
            '// placeholder',
            '// END CUSTOM SECTION',
            '}'
        ].join('\n');

        const project = [
            '{',
            '// START CUSTOM SECTION',
            '"custom": true',
            '// END CUSTOM SECTION',
            '}'
        ].join('\n');

        const result = mergeCustomSections(template, project, '//');

        expect(result).toContain('"custom": true');
    });

    it('handles template with no differences returning template as-is', () => {
        const content = 'identical content\n';
        const result = mergeCustomSections(content, content, '#');

        expect(result).toBe(content);
    });

    it('handles multiple custom sections', () => {
        const template = [
            'header',
            '# START CUSTOM SECTION a',
            '# placeholder a',
            '# END CUSTOM SECTION',
            'middle',
            '# START CUSTOM SECTION b',
            '# placeholder b',
            '# END CUSTOM SECTION',
            'footer'
        ].join('\n');

        const project = [
            'header',
            '# START CUSTOM SECTION a',
            'custom a content',
            '# END CUSTOM SECTION',
            'middle',
            '# START CUSTOM SECTION b',
            'custom b content',
            '# END CUSTOM SECTION',
            'footer'
        ].join('\n');

        const result = mergeCustomSections(template, project);

        expect(result).toContain('custom a content');
        expect(result).toContain('custom b content');
    });
});
