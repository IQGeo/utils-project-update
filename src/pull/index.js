import * as diff from 'diff';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ensureCleanWorkingTree, run } from '../helpers.js';
import { update } from '../update/index.js';

import { mergeIqgeorcFiles } from './iqgeorc.js';

/*
    Pseudocode:

    Ensure Git is installed and working tree is clean
    Clone template into tmp directory
    Ensure out directory exists
    If out directory is empty
        Move tmp to out and return
    Merge `.iqgeorc.jsonc` files
    Merge custom sections from project files
    Remove tmp directory
    Write files to out
    Format files
*/

/**
 * @satisfies {ReadonlyArray<TransformFile>}
 */
const CUSTOM_SECTION_FILES = [
    '.gitignore',
    '.devcontainer/dockerfile',
    '.devcontainer/docker-compose.yml',
    '.devcontainer/.env.example',
    'deployment/dockerfile.build',
    'deployment/dockerfile.appserver',
    'deployment/dockerfile.tools',
    'deployment/docker-compose.yml',
    'deployment/.env.example'
    // Custom content of shell files should be in separate files
];

const SUCCESS_MSG =
    'IQGeo project template pulled successfully! Please check changes to ensure they are correct';

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
    if (!ensureGit(progress)) return;

    const tmp = cloneTemplate(progress);
    if (!tmp) return;

    // Ensure out directory exists
    if (!fs.existsSync(out)) {
        fs.mkdirSync(out, { recursive: true });
    }

    // If out directory is empty, move tmp to out and return
    if (fs.readdirSync(out).length === 0) {
        fs.renameSync(tmp, out);

        progress.log(1, SUCCESS_MSG);

        return;
    }

    /** @type {WriteOp[]} */
    const writeOps = [];

    // If existing iqgeorc.jsonc, merge with template version
    if (fs.existsSync(`${out}/.iqgeorc.jsonc`)) {
        const templateIqgeorc = fs.readFileSync(`${tmp}/.iqgeorc.jsonc`, 'utf8');
        const projectIqgeorc = fs.readFileSync(`${out}/.iqgeorc.jsonc`, 'utf8');

        writeOps.push({
            dest: `${out}/.iqgeorc.jsonc`,
            content: /** @type {string} */ (
                mergeIqgeorcFiles(projectIqgeorc, templateIqgeorc, progress)
            )
        });
    }

    // Merge custom sections of project files that support them
    CUSTOM_SECTION_FILES.map(filepath => {
        const templateFileStr = fs.readFileSync(`${tmp}/${filepath}`, 'utf8');
        const projectFileStr = fs.readFileSync(`${out}/${filepath}`, 'utf8');
        if (templateFileStr === projectFileStr) return;

        const mergedText = mergeCustomSections(templateFileStr, projectFileStr);

        writeOps.push({
            dest: `${out}/${filepath}`,
            content: mergedText
        });
    });

    // Remove tmp directory
    fs.rmSync(tmp, { recursive: true, force: true });

    // Write merged files
    await writeFiles(writeOps, progress, out);

    // Format files
    const filesToFormat = [...CUSTOM_SECTION_FILES, '.iqgeorc.jsonc'].filter(filepath =>
        ['.jsonc', '.json', '.yml'].includes(path.extname(filepath))
    );

    const formatResult = run('npx', ['prettier', '--write', `${out}/{${filesToFormat.join(',')}}`]);

    if (formatResult.error) {
        progress.warn(2, 'Failed to format files');
        progress.warn(3, formatResult.error);
    }

    progress.log(1, SUCCESS_MSG);
}

// Functions

/**
 * @param {ProgressHandler} progress
 */
function ensureGit(progress) {
    const gitCheckResult = run('git', ['-v']);

    if (gitCheckResult.error) {
        progress.error(1, 'Unable to find Git executable');
        progress.error(3, gitCheckResult.error);

        return false;
    }

    try {
        ensureCleanWorkingTree();
    } catch (e) {
        progress.error(1, 'Working tree must be clean to pull template');
        progress.error(3, e);

        return false;
    }

    return true;
}

/**
 * @param {ProgressHandler} progress
 */
function cloneTemplate(progress) {
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

    return tmp;
}

/**
 * Merges custom sections from `projectFileStr` into `templateFileStr`.
 *
 * **NOTE:** If text in a custom section block matches text from the template,
 * the template text is discarded in favour of the project text.
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
 * @param {WriteOp[]} writeOps
 * @param {ProgressHandler} progress
 * @param {string} out
 */
async function writeFiles(writeOps, progress, out) {
    const writeResults = await Promise.allSettled(
        writeOps.map(({ dest, content }) => fs.promises.writeFile(dest, content))
    );

    let hasRejections = false;

    writeResults.forEach((result, i) => {
        if (result.status !== 'rejected') return;

        hasRejections = true;

        progress.warn(2, `Failed to write merged file: ${writeOps[i].dest}`);
        progress.warn(3, result.reason);
    });

    if (hasRejections) {
        progress.warn(1, 'Failed to write one or more merged files');

        return;
    }

    update({
        root: out,
        progress: {
            // ENH: merge options so we don't have to spread
            ...progress,
            log: () => {}
        }
    });
}

/**
 * @typedef {import('../typedef.js').PullOptions} PullOptions
 * @typedef {import('../typedef.js').TransformFile} TransformFile
 * @typedef {import('../typedef.js').ProgressHandler} ProgressHandler
 *
 * @typedef {{ dest: string; content: string; }} WriteOp
 */
