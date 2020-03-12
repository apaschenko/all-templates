/**
 * Lib "all-templates"
 * Exceptions
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

const prefix = '[all-template render]: ';

const error = {
    'WRONG PARSE_PARAMETERS': prefix + 'Try to call parse() function with wrong parameters. '
        + 'Valid form are: parse(startLayer<String>, data<Object> [, options<Object>]) or '
        + 'parse(data<Object> [, options<Object>])',
    'PARSING_ERROR': prefix + '[PARSING ERROR]'
};

module.exports = { error };