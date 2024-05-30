import { spawnSync } from 'node:child_process';

/**
 * Runs the passed command with the passed arguments and options.
 * Inherits stdio by default.
 *
 * @param {string} cmd
 * @param {string[]} passedArgs
 * @param {import('node:child_process').SpawnSyncOptions} options
 */
export function run(cmd, passedArgs, options = { stdio: 'inherit' }) {
    return spawnSync(cmd, passedArgs, options);
}

/**
 * Ensures the Git working tree is clean, throws if not.
 */
export function ensureCleanWorkingTree() {
    if (run('git', ['status', '-s'], { stdio: 'pipe' }).stdout.toString()) {
        throw new Error('Uncommitted changes in working tree.');
    }
}
