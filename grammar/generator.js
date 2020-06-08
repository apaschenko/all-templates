/**
 * Lib "all-templates"
 * parser generator
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const peg = require('pegjs');
const fs = require('fs');

const grammar = fs.readFileSync('./grammar.pegjs');
const parser = peg.generate(grammar.toString(), {output: 'source', /*trace: true,*/ format: 'commonjs'});

fs.writeFileSync('../lib/parser.js', parser); //return;
const layer = '{{ each `locvar` of aaa.bbb }} kkk {{with}} kkk  {{empty}} empty {{idr #bgt}} els {{end}}';
//             1234567890123456
//const layer  =`
//{{for a;;}} nm {{end}}`;
//         123456789012345

try {
    console.log(JSON.stringify(require('../lib/parser').parse(layer), null, 4));
} catch (e) {
    console.log(e)
}

