// @ts-check
import { run } from './helpers.js';

/*
 * This script runs checks, updates the version, generates/updates the changelog,
 * commits the changes, and pushes them along with the new version tag.
 */

const args = process.argv.slice(2);

if (run('git', ['status', '-s'], { stdio: 'pipe' }).stdout.toString()) {
    throw new Error('Please commit all changes before running this script.');
}

run('npm', ['run', 'lint']);
run('npm', ['version', args[0]]);
run('npx', ['changenog']);
run('git', ['add', '.']);

const pkg = await import('../package.json');

run('git', ['commit', '-m', `docs(changelog): v${pkg.default.version}`]);
run('git', ['push']);
run('git', ['push', '--tags']);
