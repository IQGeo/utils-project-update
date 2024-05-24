#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { update } from '../index.js';

yargs.help(false);
yargs.string('root').alias('r', 'root');

const argv = await /** @type {Argv} */ (yargs(hideBin(process.argv))).parse();

update({ root: argv.root });

/**
 * @typedef {import('yargs').Argv<UpdateOptionsCLI>} Argv
 * @typedef {import('../typedef.js').UpdateOptionsCLI} UpdateOptionsCLI
 */
