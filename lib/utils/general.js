/**
 * Lib "Lenka"
 * General Utils
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

let { SYMBOL: { BLANKS } } = require('../constants/internal_definitions');
const E = require('./exception');


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
        printError(e, errorDescription, options)
    }
}

function asyncCall(func, paramsInArray, processorData, timeout) {
    return new Promise(async function(resolve, reject){
        const timerId = setTimeout(function() {
            reject(printError(E.error['TIMED_OUT'], E.error['RUNTIME_ERROR'], processorData.options));
        }, timeout);
        let result, error;
        try {
            result = await func.apply(null, paramsInArray.concat(processorData));
        } catch (e) {
            error = e;
        } finally {
            clearTimeout(timerId);
            error ? reject(printError(error, E.error['RUNTIME_ERROR'], processorData.options)) : resolve(result);
        }
    })
}

function printError(e, errorDescription, options) {
    let pe = options.printError;
    let message =
        chunkString(errorDescription, pe.maxWidth, pe.indentation, pe.lineSeparator) + pe.lineSeparator;
    for (let key of Object.keys(e)) {
        let keyValue = e[key];
        if ('string' !== typeof keyValue) {
            keyValue = JSON.stringify(keyValue, null, 4);
        }
        message += key + ': ' +
            chunkString(keyValue, pe.maxWidth, pe.indentation, pe.lineSeparator) + pe.lineSeparator;
    }
    throw(new Error(message));

}


function buildInsertOperator(body, options) {
    return `${options.tag.open}@${body}${options.tag.close}`;
}

function getTimeMcs() {
    const now = process.hrtime();
    return now[0] * 1000000 + Math.floor(now[1] / 1000);
}

module.exports = {
    mergeDeep,
    cutWithEllipsis,
    chunkString,
    syncCall,
    asyncCall,
    buildInsertOperator,
    printError,
    getTimeMcs
};
