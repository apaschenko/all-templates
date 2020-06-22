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
const parser = peg.generate(
    grammar.toString(),
    {
        output: 'source',
        // trace: true,
        optimize: 'speed',
        format: 'commonjs',
        allowedStartRules: ['Start', 'PointerGet', 'Layer']
    }
);

fs.writeFileSync('../lib/parser.js', parser); //return;
//             0        10        20
//             12345678901234567890
//const layer = '{{b_11.1+aaa[bbb.ccc] #aaa }} text chunk {{ ~q11+~22-@a3[wer] }}';
//             1234567890123456
const layer  =`{{for a;;}} nm {{end}} text part {{b_11.1+aaa[bbb.ccc] #aaa }} text chunk {{ ~q11+~22-@a3[wer] }}`;
//         123456789012345
function getTime() {
    const now = process.hrtime();
    return now[0] * 1000000 + Math.floor(now[1] / 1000);
}

const startTime = getTime();
const p = require('../lib/parser');
let result;
let repeats = 1;
for (let i=0; i<repeats; i++) {
    // result = p.parse(layer);
    try {
        result = p.parse(layer);
        // console.log(JSON.stringify(require('../lib/parser').parse(layer), null, 4));
    } catch (e) {
        console.log(e)
    }
}

//console.log(`${JSON.stringify(result, null, 4)}\n\n`);
const endTime = getTime();
console.log(JSON.stringify(require('../lib/parser').parse(layer), null, 4));
console.log(`\nFinished! (${(endTime - startTime)/repeats} microseconds per iteration)`);
