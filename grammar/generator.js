/**
 * Lib "Lenka"
 * parser generator
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const peg = require('pegjs');
const fs = require('fs');

const grammar = fs.readFileSync('./grammar.pegjs');
const parser = peg.generate(
    grammar.toString(),
    {
        output: 'source',
        trace: true,
        optimize: 'speed',
        format: 'commonjs',
        allowedStartRules: ['Start', 'PointerGet', 'Layer']
    }
);

fs.writeFileSync('../lib/parser.js', parser); //return;
console.log('Done.');