// /**
//  * Lib "all-templates"
//  * Debugging Utils
//  *
//  * by Alex Paschenko <past.first@gmail.com>
//  * GPL-3.0
//  */
//
// 'use strict';
//
// function printFields(object, ) {
//     for (const key of Object.keys(source)) {
//         if ('object' === typeof source[key]) {
//             if (! target[key]) {
//                 Object.assign(target, { [key]: {} });
//             }
//             mergeDeep(target[key], source[key]);
//         } else {
//             Object.assign(target, { [key]: source[key] });
//         }
//     }
// }
//
// function chunkString (string, chunkSize, indentation, lineSeparator) {
//     let result = [];
//     let position, hyphen;
//
//     while (string.length > 0) {
//         if (string.length > chunkSize) {
//             hyphen = '';
//             for (position = chunkSize - 1; position > 0; position--) {
//                 if (BLANKS.includes(string[position])) {
//                     break;
//                 }
//             }
//             if (position === 0) {
//                 position = chunkSize - 2;
//                 hyphen = '-';
//
//             }
//             result.push(string.substring(0, position) + hyphen);
//             string = string.substring(position);
//         } else {
//             result.push(string);
//             break;
//         }
//     }
//
//     return result.join(`${lineSeparator}${indentation}${indentation}`);
// }
//
// module.exports = {
//     mergeDeep,
//     chunkString
// };