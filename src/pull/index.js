import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ensureCleanWorkingTree, run } from '../helpers.js';
import { update } from '../update/index.js';

import { compareIqgeorc, mergeCustomSections } from './diff.js';

/*
    Pseudocode:

    Ensure Git is installed and working tree is clean
    Clone template into tmp directory
    Ensure out directory exists
    If out directory is empty
        Move tmp to out and return
    If `iqgeorc.jsonc` exists in project
        Compare `.iqgeorc.jsonc` schemas
    Else
        Copy from template
    For each custom section file
        If file doesn't exist in project
            Copy from template
        Else
            Merge custom sections
    Remove tmp directory
    Write files to out
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

const SUCCESS_MSG = 'IQGeo project template pulled successfully! Please ensure changes are correct';

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
    if (!ensureGit(out, progress)) return;

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

    const templateIqgeorcStr = await fs.promises.readFile(`${tmp}/.iqgeorc.jsonc`, 'utf8');

    if (fs.existsSync(`${out}/.iqgeorc.jsonc`)) {
        const projectIqgeorcStr = await fs.promises.readFile(`${out}/.iqgeorc.jsonc`, 'utf8');

        // Compare `.iqgeorc.jsonc` keys and value types
        const iqgeorcDiffs = compareIqgeorc(projectIqgeorcStr, templateIqgeorcStr);
        if (
            iqgeorcDiffs.missingKeys.length ||
            iqgeorcDiffs.unexpectedKeys.length ||
            iqgeorcDiffs.typeMismatches.length
        ) {
            progress.warn(1, '`.iqgeorc.jsonc` schema mismatch detected', iqgeorcDiffs);
        }
    } else {
        progress.log(2, '`.iqgeorc.jsonc` not found in project, copying from template');

        writeOps.push({
            dest: `${out}/.iqgeorc.jsonc`,
            content: templateIqgeorcStr
        });
    }

    // Merge custom sections of project files that support them
    await Promise.allSettled(
        CUSTOM_SECTION_FILES.map(async filepath => {
            const templateFileStr = await fs.promises.readFile(`${tmp}/${filepath}`, 'utf8');

            if (!fs.existsSync(`${out}/${filepath}`)) {
                progress.log(2, `\`${filepath}\` not found in project, copying from template`);

                // Copy as-is if not present in project
                writeOps.push({
                    dest: `${out}/${filepath}`,
                    content: templateFileStr
                });

                return;
            }

            const projectFileStr = await fs.promises.readFile(`${out}/${filepath}`, 'utf8');
            if (templateFileStr === projectFileStr) return;

            const mergedText = mergeCustomSections(templateFileStr, projectFileStr);

            writeOps.push({
                dest: `${out}/${filepath}`,
                content: mergedText
            });
        })
    );

    // Remove tmp directory
    fs.rmSync(tmp, { recursive: true, force: true });

    // Write merged files
    await writeFiles(writeOps, progress, out);

    progress.log(1, SUCCESS_MSG);
}

// Functions

/**
 * @param {string} out
 * @param {ProgressHandler} progress
 */
function ensureGit(out, progress) {
    const gitCheckResult = run('git', ['-v']);

    if (gitCheckResult.error) {
        progress.error(1, 'Unable to find Git executable', gitCheckResult.error);

        return false;
    }

    try {
        ensureCleanWorkingTree(out);
    } catch (e) {
        progress.error(1, 'Working tree must be clean to pull template', e);

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
        progress.error(1, 'Failed to pull IQGeo project template', cloneErr);

        fs.rmSync(tmp, { recursive: true, force: true });

        return;
    }

    fs.rmSync(`${tmp}/.git`, { recursive: true, force: true });

    return tmp;
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

        progress.warn(2, `Failed to write merged file: ${writeOps[i].dest}`, result.reason);
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
 * @typedef {import('../typedef.js').Config} Config
 * @typedef {import('../typedef.js').PullOptions} PullOptions
 * @typedef {import('../typedef.js').TransformFile} TransformFile
 * @typedef {import('../typedef.js').ProgressHandler} ProgressHandler
 *
 * @typedef {{ dest: string; content: string; }} WriteOp
 */
