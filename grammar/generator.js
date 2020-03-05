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

const parser = peg.generate(grammar.toString(), {output: 'parser'});

const layer = 'q # {{# comment}} {{unless bbb}}bbb is missing.(( = bbb.ccc ddd.eee.fff( ttt.kkk.mmm, zzz.$$$, wer.der) )){{end}}{{ if tester}} tester is {{aaa}} true tester {{else}}if false {{end}} {{-q-w-e-# asset}}w';
console.log(parser.parse(layer));

1
{{= xtr}}
{{if arg.fff.dro(^1.5.6 . 7 ,2.s ,3(15).^1)."kva" # comment}}
++
    {{else}}
{{= ins}}
else-path
{{ Unless * (ftr )}}-- {{ end }}
qwerty
{{ end }}
bla