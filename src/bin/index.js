#!/usr/bin/env node
import { update } from '../index.js';

const root = process.argv.find(arg => arg.replace('--root=', ''));

update(root);
