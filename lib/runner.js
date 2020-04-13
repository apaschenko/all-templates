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


async function runner(ast, processorData) {
   let result = '';

   for (let element of ast) {
       result += await processElement(element, processorData);
   }

   return result;
}

async function processElement(ast, processorData) {
    let result;

    switch (ast.type) {
        case  'text':
            result = ast.value;
            break;

        case 'insert':
                result = await processExpression(ast.value, processorData, '', true);
                break;

    }

    return result;
}

async function processExpression(ast, processorData, layerName, enableParsing) {
    let result;
    if (Array.isArray(ast)) {
        let currentPart = processorData.data;
        
        for (let argPart of ast) {
            switch (argPart.type) {
                case 'regular':
                    if ('object' === typeof currentPart) {
                        currentPart = currentPart[argPart.value];
                        if ('function' === typeof currentPart) {
                            currentPart = await utils.asyncCall(currentPart, [], processorData, layerName);
                        }
                    } else {
                        return utils.printError(
                            E.error['MISSING_PROPERTY'],
                            E.error['RUNTIME_ERROR'],
                            processorData.options
                        );
                    }
                    break;
            }
        }
    }
}


module.exports = runner;
