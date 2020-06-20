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

class Executor {
    static async parseAndProcessSource(source, startRule, processorData, timeout) {
        let result;

        let entryPointAst = utils.syncCall(
            parser.parse,
            [source, { startRule }],
            E.error['PARSING_ERROR'],
            options
        );

        const currentPoint = processorData.point;
        processorData.point = processorData.data;
        result = await Executor.processor(entryPointAst, processorData, timeout);
        processorData.point = currentPoint;

        return result;
    }


    static async getPointerValue(ast, processorData) {
        let result, timeout;
        switch (ast.source) {
            case 'data':
                result = processorData.data;
                timeout = processorData.options.timeoutData;
                break;

            case 'local_vars':
                result = processorData.localVars;
                timeout = processorData.options.timeoutLocalVars;
                break;

            default:
                // TODO: Fire error!
                console.log('[ERROR]: Internal processor error');
        }

        for (let pp of ast.value) {
            let pointerPart = { ...pp };

            if ('object' === typeof timeout) {
                if (timeout.hasOwnProperty(pointerPart.value)) {
                    timeout = timeout[value];
                } else if (timeout.hasOwnProperty('*')) {
                    timeout = timeout['*'];
                }
            }

            if ('object' === typeof result) {
                switch (pointerPart.type) {
                    case 'function':
                        let argsValues = [];
                        for (let argAst of pointerPart.args) {
                            const argValue = await Executor.processor(argAst, processorData, timeout);
                            argsValues.push(argValue);
                        }

                        const func = result[pointerPart.value];
                        if ('function' !== typeof func) {
                            // TODO: fire error
                            console.log(`${value} not found or not a function`);
                        }
                        result = await utils.asyncCall(func, argsValues, processorData, timeout);
                        break;

                    case 'regular':
                    case 'square_brackets':
                        if ('square_brackets' === pointerPart.type) {
                            pointerPart.value = await Executor.processor(pointerPart.value, processorData, timeout);
                        }

                        if (result.hasOwnProperty(pointerPart.value)) {
                            result = result[pointerPart.value];
                            if ('function' === typeof result) {
                                result = await utils.asyncCall(result, [], processorData, timeout);
                            }
                        } else {
                            // TODO: Fire error
                            console.log(`Missing key: "${ast.value}"`);
                        }
                        break;

                    default:
                        // TODO: Fire error
                        console.log('[ERROR] Internal error');
                }

            } else {
                // TODO: fire error
                console.log(`It's not an Object!`);
            }
        }

        return result;
    }


    static async runExpression(ast, processorData, timeout) {
        let result;
        let sources = {};

        for (let key of ast.sources) {
            sources[ key ] = await Executor.processor(ast[key], processorData, timeout);
        }

        // Yes, we should hardcoded each operator separately because
        // "Function constructors" and "eval" have the too slowly
        // and unsafe implementations
        switch (ast.operator) {
            case '===':
                result = sources.left === sources.right;
                break;

            case '!==':
                result = sources.left !== sources.right;
                break;

            case '!=':
                result = sources.left != sources.right;
                break;

            case '<':
                result = sources.left < sources.right;
                break;

            case '<=':
                result = sources.left <= sources.right;
                break;

            case '>':
                result = sources.left > sources.right;
                break;

            case '>=':
                result = sources.left >= sources.right;
                break;

            case '%':
                result = sources.left % sources.right;
                break;

            case '&&':
                result = sources.left && sources.right;
                break;

            case '||':
                result = sources.left || sources.right;
                break;

            case '+':
                result = sources.left + sources.right;
                break;

            case '-':
                result = sources.left - sources.right;
                break;

            case '*':
                result = sources.left * sources.right;
                break;

            case '/':
                result = sources.left / sources.right;
                break;

            case '=':
                result = await Executor.setPointerValue(ast.left, sources.right, processorData);
                break;

            case '+=':
                result = await Executor.setPointerValue(ast.left, sources.left + sources.right, processorData);
                break;

            case '-=':
                result = await Executor.setPointerValue(ast.left, sources.left - sources.right, processorData);

        }

        return result;
    }


    static async processor(ast, processorData, timeout) {

        let result = '';
        let currentPoint;
        console.log('===> ast: ', JSON.stringify(ast, null, 4))
        switch (ast.type) {
            case 'layer':
                for (let element of ast.value) {
                    let textHasBeenAdded = false;
                    if (element.text) {
                        processorData.tags.push(element.text);
                        textHasBeenAdded = true;
                    }
                    result += await Executor.processor(element, processorData, timeout);
                    if (textHasBeenAdded) {
                        processorData.tags.pop();
                    }
                }
                break;

            case  'text':
                result = ast.value;
                break;

            case 'tag_if':
                const condition = await Executor.processor(ast.value, processorData, timeout);
                result = await Executor.processor(
                    condition ? ast.truePath : ast.falsePath,
                    processorData,
                    timeout
                );
                break;

            case 'tag_insert':
                result = await Executor.processor(ast.value, processorData, timeout);
                break;

            case 'tag_for':
                if (ast.init) {
                    await Executor.processor(ast.init, processorData, timeout);
                }
                while (await Executor.processor(ast.cond, processorData, timeout)) {
                    if (ast.cond) {
                        result += await Executor.processor(ast.value, processorData, timeout);
                    }
                    if (ast.after) {
                        await Executor.processor(ast.after, processorData, timeout);
                    }
                }
                break;

            case 'tag_each':
                let source = await Executor.processor(ast.source, processorData, timeout);
                if ('object' !== typeof source) {
                    source = [];
                }
                const keys = Object.keys(source);
                if (keys.length > 0) {
                    const delimiter = (ast.delimiter && ast.delimiter.length)
                        ? await Executor.processor(ast.delimiter, processorData, timeout) : '';
                    let res = [];
                    for (let item of keys) {
                        processorData.localVars[ast.variable.value] = { key: item, value: source[item] };
                        res.push(await Executor.processor(ast.value, processorData, timeout));
                    }
                    result = res.join(delimiter);
                } else {
                    if (ast.empty && ast.empty.length) {
                        result = await Executor.processor(ast.empty, processorData, timeout);
                    }
                }
                break;

            case 'tag_while':
                while (await Executor.processor(ast.expression, processorData, timeout)) {
                    result += await Executor.processor(ast.layer, processorData, timeout);
                }
                break;

            case 'tag_do_while':
                do {
                    result += await Executor.processor(ast.layer, processorData, timeout);
                } while (await Executor.processor(ast.expression, processorData, timeout));
                break;

            case 'tag_set':
                await Executor.processor(ast.expression, processorData, timeout);
                break;

            case 'tag_empty':
                break;

            case 'need_to_parse':
                result = await Executor.processor(ast.value, processorData, timeout);
                result = await Executor.parseAndProcessSource(result, 'Layer', processorData, timeout);
                break;

            case 'expression':
                result = await Executor.runExpression(ast, processorData, timeout);
                break;

            default:
                console.log(`Don't implemented: "${ast.type}" :(`);
        }
        console.log('===> result: ', JSON.stringify(result, null, 4), '\n===> typeof result: ', typeof result)
        return result;
    }

}


module.exports = Executor;
