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


async function runner(ast, data, options) {
   let result = '';

   for (let element of ast) {
       result += await processElement(element, data, options);
   }

   return result;
}

async function processElement(ast, data, options) {
    let result;

    switch (ast.type) {
        case  'text':
            result = ast.value;
            break;

        case 'insert':
            if (Array.isArray(ast.value)) {
                result = await processArg(ast.value, data, options);
                break;
            }
    }

    return result;
}

async function processArg(ast, data, options) {

}


module.exports = runner;
