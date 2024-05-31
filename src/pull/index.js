import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ensureCleanWorkingTree, run } from '../helpers.js';
import { update } from '../update/index.js';

import { mergeIqgeorcFiles } from './merge.js';

/**
 * Pulls the latest IQGeo project template from GitHub.
 *
 * @param {PullOptions} options
 */
export function pull({
    out = './utils-project-template',
    progress = {
        log: (level, info) => console.log(info),
        warn: (level, info) => console.warn(info),
        error: (level, info) => console.error(info)
    }
} = {}) {
    const gitCheckResult = run('git', ['-v'], { stdio: 'pipe' });

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

    const hasExistingIqgeorc = fs.existsSync(`${out}/.iqgeorc.jsonc`);
    const templateIqgeorc = fs.readFileSync(`${tmp}/.iqgeorc.jsonc`, 'utf8');

    const iqgeorc = /** @type {string} */ (
        hasExistingIqgeorc
            ? mergeIqgeorcFiles(
                  fs.readFileSync(`${out}/.iqgeorc.jsonc`, 'utf8'),
                  templateIqgeorc,
                  progress
              )
            : templateIqgeorc
    );

    // TODO: move custom sections to tmp

    fs.writeFileSync(`${tmp}/.iqgeorc.jsonc`, iqgeorc);
    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out, { recursive: true });
    fs.renameSync(tmp, out);

    // TODO: add silent progress option?
    update({ root: out, progress });

    progress.log(1, 'IQGeo project template pulled successfully!');
}

/**
 * @typedef {import('../typedef.js').PullOptions} PullOptions
 */
