/**
 * Lib "all-templates"
 * Entry point
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */


const parser = require('./parser');
const utils = require('./utils/general');
const defaults = require('./constants/default_options');
const E = require('./utils/exception');
const runner = require('./runner');

async function main(layerOrData, dataOrOptions, optionsOrNone, restrictedParameter) {
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

    let entryPointAst = utils.syncCall(
        parser.parse,
        [`${options.tag.open}@${options['entryPoint']}${options.tag.close}`, options],
        E.error['PARSING_ERROR'],
        options
    );

    console.log('===> AST: ' , JSON.stringify(entryPointAst, null, 4))

    const processorData = {
       data,
       options,
       tags: [],
        localVars: {}
    };

    return await runner(entryPointAst, processorData, data);
}


module.exports = main;
