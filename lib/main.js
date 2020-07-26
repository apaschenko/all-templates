/**
 * Lib "Lenka"
 * Entry point
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

const constants = require('./constants/constant');
const parser = require('./parser');
const utils = require('./utils/general');
const defaults = require('./constants/default_options');
const E = require('./utils/exception');
const executor = require('./executor');


async function run(layerOrData, dataOrOptions, optionsOrNone, restrictedParameter) {
    let data, options;

    if (
        ('string' === typeof layerOrData)
        && ('object' === typeof dataOrOptions)
        && (('object' === typeof optionsOrNone) || (optionsOrNone === undefined))
        && (restrictedParameter === undefined)
    ) {
        data = dataOrOptions;
        options = utils.mergeDeep([defaults, optionsOrNone || {}]);
        data[options['entryPoint']] = layerOrData;
    } else if (
        ('object' == typeof layerOrData)
        && (('object' === typeof dataOrOptions) || (dataOrOptions === undefined))
        && (optionsOrNone === undefined)
    ) {
        data = layerOrData;
        options = utils.mergeDeep([defaults, dataOrOptions || {}]);
    } else {
        return Throw(new Error(E.error['WRONG PARSE_PARAMETERS']));
    }

    const entryPointDef = `*${options['entryPoint']}`;

    // let entryPointAst = utils.syncCall(
    //     parser.parse,
    //     [entryPointDef, {startRule: 'PointerGet'}],
    //     E.error['PARSING_ERROR'],
    //     options
    // );

    const processorData = {
        data,
        options,
        tags: [],
        localVars: {}
    };

    return await executor.parseAndProcessSource(entryPointDef, 'PointerGet', processorData);
}


module.exports = {
    run,
    ...constants
};
