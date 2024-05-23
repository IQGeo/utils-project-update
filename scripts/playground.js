// @ts-check
import { run } from './helpers.js';

/*
 * This script clones the utils-project-template repository into the playground
 * directory and removes the .git directory.
 */

const OUT_DIR = 'utils-project-template';

run('rm', ['-rf', `playground/${OUT_DIR}`]);
run('git', [
    'clone',
    '--depth=1',
    'https://github.com/IQGeo/utils-project-template',
    `playground/${OUT_DIR}`
]);
run('rm', ['-rf', `playground/${OUT_DIR}/.git`]);
