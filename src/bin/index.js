#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

yargs(hideBin(process.argv))
    .command(
        '$0',
        '',
        /** @param {import('yargs').Argv<UpdateOptionsCLI>} y */
        y => y.string('root').alias('r', 'root'),
        async ({ root }) => {
            const { update } = await import('../update/index.js');

            update({ root });
        }
    )
    .command(
        'pull',
        '',
        /** @param {import('yargs').Argv<PullOptionsCLI>} y */
        y => y.string('out').alias('o', 'out'),
        async ({ out }) => {
            const { pull } = await import('../pull/index.js');

            pull({ out });
        }
    )
    .help(false)
    .parse();

/**
 * @typedef {import('../typedef.js').UpdateOptionsCLI} UpdateOptionsCLI
 * @typedef {import('../typedef.js').PullOptionsCLI} PullOptionsCLI
 */
