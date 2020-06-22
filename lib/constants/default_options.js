/**
 * Lib "all-templates"
 * Set of Constants
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const constants = require('./constant');

module.exports = {
    tag: {
        open : '{{',
        close: '}}'
    },
    entryPoint  : 'start',
    escapeSymbol: '\\',
    printError  : {
        lineSeparator  : '\r\n',
        indentation    : '\t',
        maxWidth       : 120,
        maxPhLength    : 40,
        leftTailLength : 15,
        rightTailLength: 15,
        tag: {
            before: '\u21b3',
            after: '\u21b2'
        }
    },
    data: {
        timeout: 10000,
        behavior: constants.BEHAVIOR.RE_DECLARE
    },
    localVars: {
        timeout: 10000,
        behavior: constants.BEHAVIOR.RE_DECLARE
    },
    debug: true
};
