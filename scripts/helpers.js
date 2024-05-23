// @ts-check
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
