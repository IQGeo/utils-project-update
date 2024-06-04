import * as diff from 'diff';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ensureCleanWorkingTree, run } from '../helpers.js';
import { update } from '../update/index.js';

import { mergeIqgeorcFiles } from './iqgeorc.js';

/*
  Steps:

  1. Ensure Git is installed
  2. Ensure working tree is clean
  3. Create tmp directory
  4. Clone project template into tmp directory
  5. Remove `.git` directory from tmp directory
  6. Merge `.iqgeorc.jsonc` files
  7. Run `update` on tmp directory
  8. Merge custom sections from project files
  9. Format files
  10. Replace existing project directory with tmp directory
*/

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
 * Pulls the latest IQGeo project template from GitHub and merges with existing files.
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

    // Create temporary directory to clone template into
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

    // Merge custom sections of project files that support them
    await Promise.allSettled(
        CUSTOM_SECTION_FILES.map(filepath => {
            const templateFileStr = fs.readFileSync(`${tmp}/${filepath}`, 'utf8');
            const projectFileStr = fs.readFileSync(`${out}/${filepath}`, 'utf8');
            if (templateFileStr === projectFileStr) return;

            const mergedText = mergeCustomSections(templateFileStr, projectFileStr);

            return fs.promises.writeFile(`${tmp}/${filepath}`, mergedText);
        })
    );

    // Format files
    const filesToFormat = [...CUSTOM_SECTION_FILES, '.iqgeorc.jsonc'].filter(filepath =>
        ['.jsonc', '.json', '.yml'].includes(path.extname(filepath))
    );

    const formatResult = run('prettier', ['--write', `${tmp}/{${filesToFormat.join(',')}}`]);

    if (formatResult.error) {
        progress.warn(2, 'Failed to format files');
        progress.warn(3, formatResult.error);
    }

    // Replace out directory with tmp directory
    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out, { recursive: true });
    fs.renameSync(tmp, out);

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
        // `part.added` is true for project file changes, so we parse
        // and add custom sections from those below.
        // Otherwise, we just add the template text as-is.
        if (!part.added) {
            mergedText += part.value;

            return;
        }

        // Parts can either have complete custom sections, or just the start or end of one
        const matches =
            part.value.match(/# START CUSTOM SECTION\s.*?# END CUSTOM SECTION\s*/gs) ||
            part.value.match(/# START CUSTOM SECTION\s.*|.*?# END CUSTOM SECTION(\s+|$)/gs);

        matches?.forEach(section => {
            if (!mergedText.endsWith('\n') && !section.startsWith('\n')) {
                mergedText += '\n';
            }

            mergedText += section;
        });
    });

    return mergedText;
}

/**
 * @typedef {import('../typedef.js').PullOptions} PullOptions
 * @typedef {import('../typedef.js').TransformFile} TransformFile
 */
