/**
 * Lib "all-templates"
 * Placeholder parser
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const peg = require('pegjs');
const fs = require('fs');

const grammar = fs.readFileSync('./grammar.pegjs');
//const grammar = fs.readFileSync('./javascript.pegjs');

const parser = peg.generate(grammar.toString(), {output: 'source'/*, trace: true*/});

fs.writeFileSync('../lib/parser.js', parser); return;
//const layer = 'q # {{# comment}} {{unless bbb}}bbb is missing.(( = bbb.ccc ddd.eee.fff( ttt.kkk.mmm, zzz.$$$, wer.der) )){{end}}{{ if tester}} tester is {{aaa}} true tester {{else}}if false {{end}} {{-q-w-e-# asset}}w';
const layer  =`
{{for a;;}} nm {{end}}`;
//         123456789012345

try {
    console.log(JSON.stringify(parser.parse(layer), null, 4));
} catch (e) {
    console.log(e)
}

