// @ts-check
import { createRequire } from 'node:module';
import readline from 'node:readline';

import { ensureCleanWorkingTree, run } from '../src/helpers.js';

const require = createRequire(import.meta.url);

/*
 * This script runs checks, updates the version, generates/updates the changelog,
 * commits the changes, and pushes them along with the new version tag.
 */

const args = process.argv.slice(2);

ensureCleanWorkingTree(process.cwd());

run('npm', ['run', 'lint']);
run('npm', ['version', args[0]]);
run('npx', ['changenog']);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('Review changes then press enter to continue...');

await new Promise(res => {
    rl.on('line', () => {
        rl.close();

        // @ts-expect-error - JSDoc typing for this looks gross
        res();
    });
});

run('git', ['add', '.']);

const pkg = require('../package.json');

run('git', ['commit', '-m', `docs(changelog): v${pkg.version}`]);
run('git', ['push']);
run('git', ['push', '--tags']);
