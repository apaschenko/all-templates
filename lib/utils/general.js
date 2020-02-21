/**
 * Lib "all-templates"
 * General Utils
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const { SYMBOL: { BLANKS } } = require('../constants/internal_definitions');

/**
 * Deep merge two or more objects.
 * @param objects
 */
function mergeDeep(...objects)
{
    const isObject = obj => obj && typeof obj === 'object';
    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(
            key => {
                const pVal = prev[key];
                const oVal = obj[key];
                if (Array.isArray(pVal) && Array.isArray(oVal)) {
                    prev[key] = pVal.concat(...oVal);
                } else if (isObject(pVal) && isObject(oVal)) {
                    prev[key] = mergeDeep(pVal, oVal);
                } else { prev[key] = oVal; }
            }
        );
        return prev;
    }, {});
}


function chunkString (string, chunkSize, indentation, lineSeparator) {
    let result = [];
    let position, hyphen;

    while (string.length > 0) {
        if (string.length > chunkSize) {
            hyphen = '';
            for (position = chunkSize - 1; position > 0; position--) {
                if (BLANKS.includes(string[position])) {
                    break;
                }
            }
            if (position === 0) {
                position = chunkSize - 2;
                hyphen = '-';

            }
            result.push(string.substring(0, position) + hyphen);
            string = string.substring(position);
        } else {
            result.push(string);
            break;
        }
    }

    return result.join(`${lineSeparator}${indentation}${indentation}`);
}

module.exports = {
    mergeDeep,
    chunkString
};