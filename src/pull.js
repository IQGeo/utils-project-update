import { ensureCleanWorkingTree, run } from './helpers.js';

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
}) {
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

    run('rm', ['-rf', out]);

    const cloneErr = run(
        'git',
        ['clone', '--quiet', '--depth=1', 'https://github.com/IQGeo/utils-project-template', out],
        { stdio: 'pipe' }
    )
        .stderr.toString()
        .trim();

    if (cloneErr) {
        progress.error(1, 'Failed to pull IQGeo project template');
        progress.error(3, cloneErr);

        return;
    }

    run('rm', ['-rf', `${out}/.git`]);

    progress.log(1, 'IQGeo project template pulled successfully');
}

/**
 * @typedef {import('./typedef.js').PullOptions} PullOptions
 */
