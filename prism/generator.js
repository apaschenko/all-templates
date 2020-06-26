/**
 * Lib "Lenka"
 * General Utils
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';


const Prism = require('prismjs');
const fs = require('fs');
const path = require('path');

// The code snippet you want to highlight, as a string
//const code = `var data = 1;`;

// Returns a highlighted HTML string
// const html = Prism.highlight(code, Prism.languages.javascript, 'javascript');
const scanDir = '../examples';
const targetDir = '../docs/examples';

const filesNames = fs.readdirSync(scanDir);

var NEW_LINE_EXP = /\n(?!$)/g;
var lineNumbersWrapper;

Prism.hooks.add('after-tokenize', function (env) {
    var match = env.code.match(NEW_LINE_EXP);
    var linesNum = match ? match.length + 1 : 1;
    var lines = new Array(linesNum + 1).join('<span></span>');

    lineNumbersWrapper = `<span aria-hidden="true" class="line-numbers-rows">${lines}</span>`;
});



for (let fileName of filesNames) {
    let content = fs.readFileSync(path.join(scanDir, fileName)).toString();
    const highlighted = Prism.highlight(content, Prism.languages.javascript, 'javascript');

    // const regexp = /<\/?span[^>]+>/gi;
    // let spans = [];
    //
    //  const html = '<table class="prism-table">\n' +
    //      highlighted
    //      .split('\n')
    //      .map(
    //          function(line, num) {
    //               if (spans.length) {
    //                 if
    //               }
    //          } && !line.trimLeft().startsWith('<span')) {
    //              //     line = span + line;
                 // }
//                 //
//                 // const openSpans = line.match(regexp);
//                 //
//                 // if (openSpans) {
//                 //     if (! line.trimRight().endsWith('</span>')) {
//                 //         line += '</span>';
//                 //     }
//                 //
//                 //     span = openSpans.pop();
//                 //     console.log(span)
//                 // }
//                 //
//                 // return `<tr><td class="line-numbers-rows">${(num + 1).toString()}</td><td>${line}</td></tr>`
// return line;
//             }
//         )
//         .join('\n') + '</table>';


    fs.writeFileSync(path.join(targetDir, `${path.parse(fileName).name}.html`), highlighted);
}