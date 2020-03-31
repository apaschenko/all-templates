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

function main(layerOrData, dataOrOptions, optionsOrNone, restrictedParameter) {

    return new Promise(function (resolve, reject) {
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
            return reject(new Error(E.error['WRONG PARSE_PARAMETERS']));
        }
console.log('===> entryPoint: ', options['entryPoint'])
        let entryPointAst = utils.syncCall(
            parser.parse,
            [options['entryPoint'], options],
            reject,
            E.error['PARSING_ERROR'],
            options
        );

        console.log('===> AST: ' , entryPointAst)
    });


}


module.exports = main;
