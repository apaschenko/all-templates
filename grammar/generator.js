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

const parser = peg.generate(grammar.toString(), {output: 'parser', trace: true});

//const layer = 'q # {{# comment}} {{unless bbb}}bbb is missing.(( = bbb.ccc ddd.eee.fff( ttt.kkk.mmm, zzz.$$$, wer.der) )){{end}}{{ if tester}} tester is {{aaa}} true tester {{else}}if false {{end}} {{-q-w-e-# asset}}w';
const layer  =
`
1        10        20
123456789012345678901234567890
{{if (("f" == kga) != zzz)}} {{ each \`abcd\` of gtr with sss }} ,,,{{=klm."ddd".11.23.\`aaa\`}} {{empty}} ... {{end}}
{{ # comment}} if-part
{{ art }} {{ *func.1("if")}} 
{{else }} else-part
{{end}}
`;
//         123456789012345
const l = '{{if f}}{{end}}';
console.log(parser.parse(layer));
