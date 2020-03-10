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

async function main(layerOrData, dataOrOptions, optionsOrNone, restrictedParameter) {
    var data, options;

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
        
    }

}


module.exports = main;
