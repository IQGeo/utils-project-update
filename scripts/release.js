// @ts-check
import { createRequire } from 'node:module';

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
run('git', ['add', '.']);

const pkg = require('../package.json');

run('git', ['commit', '-m', `docs(changelog): v${pkg.version}`]);
run('git', ['push']);
run('git', ['push', '--tags']);
