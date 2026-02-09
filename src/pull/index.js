import * as jsonc from 'jsonc-parser';
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
 * @satisfies {ReadonlyArray<TemplateFilePath>}
 */
const INCLUDE_FILES = [
    '.gitignore',
    'tsconfig.json',
    '.devcontainer/dockerfile',
    '.devcontainer/docker-compose.yml',
    '.devcontainer/.env.example',
    '.devcontainer/devcontainer.json',
    '.devcontainer/entrypoint.d/270_adjust_oidc_conf.sh',
    '.devcontainer/entrypoint.d/600_init_db.sh',
    '.devcontainer/entrypoint.d/610_upgrade_db.sh',
    '.devcontainer/entrypoint.d/850_fetch.sh',
    '.devcontainer/devserver_config/oidc/conf.json',
    '.devcontainer/remote_host/devcontainer.json',
    '.devcontainer/remote_host/dockerfile',
    '.devcontainer/remote_host/docker-compose.yml',
    '.devcontainer/remote_host/docker-compose-shared.yml',
    '.github/workflows/build-deployment-images.yml',
    '.vscode/tasks.json',
    'deployment/README.md',
    'deployment/dockerfile.build',
    'deployment/dockerfile.appserver',
    'deployment/dockerfile.tools',
    'deployment/docker-compose.yml',
    'deployment/.env.example',
    'deployment/build_images.sh',
    'deployment/fleet.yaml',
    'deployment/values.yaml',
    'deployment/minikube/values-minikube.yaml',
    'deployment/minikube/minikube_image_load.sh',
    'deployment/entrypoint.d/270_adjust_oidc_conf.sh',
    'deployment/entrypoint.d/600_init_db.sh',
    'deployment/entrypoint.d/610_upgrade_db.sh',
    'deployment/appserver_config/oidc/conf.json'
    // Custom content of shell files should be in separate files
];

// const TEMPLATE_BRANCH = 'main';
const TEMPLATE_BRANCH = 'dev';

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
    /** @type {Config} */
    const templateIqgeorc = jsonc.parse(templateIqgeorcStr);
    const { excludes, updatedIqgeorcContent } = await handleIqgeorc(
        out,
        templateIqgeorcStr,
        templateIqgeorc,
        progress
    );

    if (updatedIqgeorcContent) {
        writeOps.push({
            dest: `${out}/.iqgeorc.jsonc`,
            content: updatedIqgeorcContent
        });
    }

    // add missing files and merge custom sections of project files that support them
    await Promise.allSettled(
        INCLUDE_FILES.map(async filepath => {
            const templateFileStr = await fs.promises.readFile(`${tmp}/${filepath}`, 'utf8');
            // check if path matches any of the excludes patterns
            if (excludes.some(exclude => new RegExp(exclude).test(filepath))) return;

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

            const isJsonc = filepath.endsWith('.jsonc') || filepath === 'tsconfig.json';

            const mergedText = mergeCustomSections(
                templateFileStr,
                projectFileStr,
                isJsonc ? '//' : '#'
            );

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

/**
 * @param {string} out
 * @param {string} templateIqgeorcStr
 * @param {Config} templateIqgeorc
 * @param {ProgressHandler} progress
 * @returns {Promise<{ excludes: string[]; updatedIqgeorcContent?: string }>}
 */
async function handleIqgeorc(out, templateIqgeorcStr, templateIqgeorc, progress) {
    /** @type {string[]} */
    let excludes = [];

    if (!fs.existsSync(`${out}/.iqgeorc.jsonc`)) {
        progress.log(2, '`.iqgeorc.jsonc` not found in project, copying from template');

        return { excludes, updatedIqgeorcContent: templateIqgeorcStr };
    }

    const projectIqgeorcStr = await fs.promises.readFile(`${out}/.iqgeorc.jsonc`, 'utf8');
    /** @type {Record<string, unknown>} */
    const projectIqgeorc = jsonc.parse(projectIqgeorcStr);

    excludes = Array.isArray(projectIqgeorc.exclude_file_paths)
        ? (projectIqgeorc.exclude_file_paths ?? [])
        : [];

    const formattingOptions = { insertSpaces: true };
    let projectIqgeorcStrUpdated = projectIqgeorcStr;
    let hasIqgeorcChanges = false;
    /** @type {Record<string, unknown>} */
    const updatedProjectIqgeorc = { ...projectIqgeorc };

    // Update template version
    if (projectIqgeorc.version !== templateIqgeorc.version) {
        const edit = jsonc.modify(projectIqgeorcStrUpdated, ['version'], templateIqgeorc.version, {
            formattingOptions
        });
        projectIqgeorcStrUpdated = jsonc.applyEdits(projectIqgeorcStrUpdated, edit);
        updatedProjectIqgeorc.version = templateIqgeorc.version;
        hasIqgeorcChanges = true;
    }

    // Add deployment section if missing
    if (!projectIqgeorc.deployment) {
        const deploymentValue = templateIqgeorc.deployment ?? {};
        const edit = jsonc.modify(projectIqgeorcStrUpdated, ['deployment'], deploymentValue, {
            formattingOptions
        });
        projectIqgeorcStrUpdated = jsonc.applyEdits(projectIqgeorcStrUpdated, edit);
        updatedProjectIqgeorc.deployment = deploymentValue;
        hasIqgeorcChanges = true;
    }

    // Compare `.iqgeorc.jsonc` keys and value types
    const iqgeorcDiffs = compareIqgeorc(updatedProjectIqgeorc, templateIqgeorc);
    const missingKeys = iqgeorcDiffs.missingKeys.filter(key => key !== 'deployment');
    if (
        missingKeys.length ||
        iqgeorcDiffs.unexpectedKeys.length ||
        iqgeorcDiffs.typeMismatches.length
    ) {
        progress.warn(1, '`.iqgeorc.jsonc` schema mismatch detected', {
            ...iqgeorcDiffs,
            missingKeys
        });
    }

    return {
        excludes,
        updatedIqgeorcContent: hasIqgeorcChanges ? projectIqgeorcStrUpdated : undefined
    };
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
        [
            'clone',
            '--quiet',
            '--depth=1',
            '--branch',
            TEMPLATE_BRANCH,
            'https://github.com/IQGeo/utils-project-template',
            tmp
        ],
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
    // Ensure parent directories exist
    await Promise.allSettled(
        writeOps.map(({ dest, content }) => fs.mkdirSync(path.dirname(dest), { recursive: true }))
    );
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
 * @typedef {import('../typedef.js').TemplateFilePath} TemplateFilePath
 * @typedef {import('../typedef.js').ProgressHandler} ProgressHandler
 *
 * @typedef {{ dest: string; content: string; }} WriteOp
 */
