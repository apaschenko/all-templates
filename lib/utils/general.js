/**
 * Lib "all-templates"
 * General Utils
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

let {SYMBOL: { BLANKS }} = require('../constants/internal_definitions');

function isObject (obj) {
    return obj && typeof obj === 'object'
}

/**
 * Deep merge two or more objects.
 * @param objects
 */
function mergeDeep(objects) {
    const result = {};
    for (let obj of objects) {
        for (let key of Object.keys(obj)) {
            let prevValue = result[key];
            let valueToMerge = obj[key];
            if (Array.isArray(prevValue) && Array.isArray(valueToMerge)) {
                result[key] = prevValue.concat(valueToMerge);
            } else if (isObject(prevValue) && isObject(valueToMerge)) {
                result[key] = mergeDeep([prevValue, valueToMerge]);
            } else if ((valueToMerge !== null) && (valueToMerge !== undefined)) {
                result[key] = valueToMerge;
            }
        }
    }

    return result;
}


function cutWithEllipsis(string, preliminaryStartPos, preliminaryEndPos, maxLength, cropRight) {
    let result;
    const stringLength = string.length;
    preliminaryStartPos = Math.max(preliminaryStartPos, 0);
    preliminaryEndPos = Math.min(preliminaryEndPos, stringLength);
    const needToEllipsis = (preliminaryEndPos - preliminaryStartPos) > maxLength;
    if (cropRight) {
        const endPos = Math.min(preliminaryEndPos, preliminaryStartPos + maxLength);

        result = needToEllipsis
            ? string.substring(preliminaryStartPos, endPos - 1) + '\u2026'
            : string.substring(preliminaryStartPos, endPos);
    } else {
        const startPos = Math.max(preliminaryStartPos, preliminaryEndPos - maxLength);

        result = needToEllipsis
            ? '\u2026' + string.substring(startPos + 1, preliminaryEndPos)
            : string.substring(startPos, preliminaryEndPos)
    }

    return result;
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


function syncCall(func, paramsInArray, errorDescription, options) {
    try {
        return func.apply(null, paramsInArray);
    } catch(e) {
        let pe = options.printError;
        let message =
            chunkString(errorDescription, pe.maxWidth, pe.indentation, pe.lineSeparator) + pe.lineSeparator;
        for (let key of Object.keys(e)) {
            message += key + ': ' +
                chunkString(e[key], pe.maxWidth, pe.indentation, pe.lineSeparator) + pe.lineSeparator;
        }
        return Throw(new Error(message));
    }
}


module.exports = {
    mergeDeep,
    cutWithEllipsis,
    chunkString,
    syncCall
};