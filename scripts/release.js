// @ts-check
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

/**
 * @param {string} cmd
 * @param {string[]} passedArgs
 * @param {import('node:child_process').SpawnSyncOptions} options
 */
function run(cmd, passedArgs, options = { stdio: 'inherit' }) {
    return spawnSync(cmd, passedArgs, options);
}

if (run('git', ['status', '-s'], { stdio: 'pipe' }).stdout.toString()) {
    throw new Error('Please commit all changes before running this script.');
}

run('npm', ['run', 'lint']);
run('npm', ['version', args[0]]);
run('npm', ['run', 'changenog']);
run('git', ['add', '.']);

const pkg = await import('../package.json');

run('git', ['commit', '-m', `docs(changelog): v${pkg.default.version}`]);
run('git', ['push']);
run('git', ['push', '--tags']);
