import * as diff from 'diff';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ensureCleanWorkingTree, run } from '../helpers.js';
import { update } from '../update/index.js';

import { mergeIqgeorcFiles } from './iqgeorc.js';

// TODO: join paths with path.join

/**
 * @satisfies {ReadonlyArray<TransformFile>}
 */
const CUSTOM_SECTION_FILES = [
    '.devcontainer/dockerfile',
    '.devcontainer/docker-compose.yml',
    '.devcontainer/.env.example',
    'deployment/dockerfile.build',
    'deployment/dockerfile.appserver',
    'deployment/dockerfile.tools',
    'deployment/docker-compose.yml',
    'deployment/.env.example'
];

/**
 * Pulls the latest IQGeo project template from GitHub.
 *
 * @param {PullOptions} options
 */
export async function pull({
    out = './utils-project-template',
    progress = {
        log: (level, info) => console.log(info),
        warn: (level, info) => console.warn(info),
        error: (level, info) => console.error(info)
    }
} = {}) {
    const gitCheckResult = run('git', ['-v']);

    if (gitCheckResult.error) {
        progress.error(1, 'Unable to find Git executable');
        progress.error(3, gitCheckResult.error);

        return;
    }

    try {
        ensureCleanWorkingTree();
    } catch (e) {
        progress.error(1, 'Working tree must be clean to pull template');
        progress.error(3, e);

        return;
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), '.tmp-'));

    const cloneErr = run(
        'git',
        ['clone', '--quiet', '--depth=1', 'https://github.com/IQGeo/utils-project-template', tmp],
        { stdio: 'pipe' }
    )
        .stderr.toString()
        .trim();

    if (cloneErr) {
        progress.error(1, 'Failed to pull IQGeo project template');
        progress.error(3, cloneErr);

        fs.rmSync(tmp, { recursive: true, force: true });

        return;
    }

    fs.rmSync(`${tmp}/.git`, { recursive: true, force: true });

    // If existing iqgeorc.jsonc, merge with template version
    if (fs.existsSync(`${out}/.iqgeorc.jsonc`)) {
        const templateIqgeorc = fs.readFileSync(`${tmp}/.iqgeorc.jsonc`, 'utf8');
        const projectIqgeorc = fs.readFileSync(`${out}/.iqgeorc.jsonc`, 'utf8');
        const mergedIqgeorc = /** @type {string} */ (
            mergeIqgeorcFiles(projectIqgeorc, templateIqgeorc, progress)
        );

        fs.writeFileSync(`${tmp}/.iqgeorc.jsonc`, mergedIqgeorc);
    }

    update({
        root: tmp,
        progress: {
            // ENH: merge options so we don't have to spread
            ...progress,
            log: () => {}
        }
    });

    await Promise.allSettled(
        CUSTOM_SECTION_FILES.map(filepath => {
            const templateFileStr = fs.readFileSync(`${tmp}/${filepath}`, 'utf8');
            const projectFileStr = fs.readFileSync(`${out}/${filepath}`, 'utf8');
            if (templateFileStr === projectFileStr) return;

            const mergedText = mergeCustomSections(templateFileStr, projectFileStr);

            return fs.promises.writeFile(`${tmp}/${filepath}`, mergedText);
        })
    );

    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out, { recursive: true });
    fs.renameSync(tmp, out);

    // Format files
    const filesToFormat = [...CUSTOM_SECTION_FILES, '.iqgeorc.jsonc'].filter(filepath =>
        ['.jsonc', '.json', '.yml'].includes(path.extname(filepath))
    );

    const formatResult = run('prettier', ['--write', `${out}/{${filesToFormat.join(',')}}`]);

    if (formatResult.error) {
        progress.warn(2, 'Failed to format files');
        progress.warn(3, formatResult.error);
    }

    progress.log(1, 'IQGeo project template pulled successfully!');
}

/**
 * Merges custom sections from `projectFileStr` into `templateFileStr`.
 *
 * @param {string} templateFileStr
 * @param {string} projectFileStr
 */
function mergeCustomSections(templateFileStr, projectFileStr) {
    const diffs = diff.diffLines(templateFileStr, projectFileStr);

    let mergedText = '';

    diffs.forEach(part => {
        if (!part.added) {
            mergedText += part.value;

            if (!mergedText.endsWith('\n')) {
                mergedText += '\n\n';
            }

            return;
        }

        const customSectionRegex =
            /# START CUSTOM SECTION.*# END CUSTOM SECTION\s*|# (START|END) CUSTOM SECTION\s*/gs;

        mergedText += part.value.match(customSectionRegex)?.join('') || '';
    });

    return mergedText;
}

/**
 * @typedef {import('../typedef.js').PullOptions} PullOptions
 * @typedef {import('../typedef.js').TransformFile} TransformFile
 */
