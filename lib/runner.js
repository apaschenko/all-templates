/**
 * Lib "all-templates"
 * Runner - layer executor
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */


const parser = require('./parser');
const utils = require('./utils/general');
const E = require('./utils/exception');

function runner(ast, data, options) {
    switch (ast.type) {
        case 'if':
        case 'unless':
            let condition
    }

}


module.exports = runner;
