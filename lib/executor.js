/**
 * Lib "Lenka"
 * Runner - layer executor
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

const constants = require('./constants/constant');
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
            processorData.options
        );
        // console.log('\n========\n========\n========\n');
        result = await Executor.processor(entryPointAst, processorData, timeout);

        return result;
    }


    static async getPointerValue(ast, processorData) {
        let result, timeout;
        switch (ast.source) {
            case 'data':
                result = processorData.data;
                timeout = processorData.options.data.timeout;
                break;

            case 'local_vars':
                result = processorData.localVars;
                timeout = processorData.options.localVars.timeout;
                break;

            default:
                // TODO: Fire error!
                console.log('[ERROR]: Internal processor error. ast: ', ast);
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
                console.log(`[Error] It's not an Object!`);
            }
        }

        return result;
    }


    static async setPointerValue(ast, value, processorData) {
        let parentPoint, point, behavior, parentPart, childPart, childPartName, parentType, childType;

        if ('data' === ast.source) {
            point = processorData.data;
            behavior = processorData.options.data;
        }
        else {
            point = processorData.localVars;
            behavior = processorData.options.localVars;
        }

        for (childPart of ast.value) {

            if ('square_brackets' === childPart.type) {
             childPartName = await Executor.processor(childPart, processorData);
            } else {
             childPartName = childPart.value;
            }

            if (parentPart) {
                const neededParentType = ('number' === typeof childPartName) ? 'array' : 'object';
                const realParentType = Array.isArray(parentPoint) ? 'array' : typeof parentPoint;

                if (parentPoint.hasOwnProperty(childPartName) || ('array' === realParentType)) {
                    if (neededParentType !== realParentType) {
                        if (constants.BEHAVIOR.RE_DECLARE === behavior) {
                         parentPoint = ('array' === neededParentType) ? [] : {};
                        } else {
                         // TODO: Fire error
                         console.log('Trying to change a type of source when re-declare is disabled');
                        }
                    }
                } else {
                    if (behavior >= constants.BEHAVIOR.CREATE) {
                        parentPoint = ('array' === neededParentType) ? [] : {};
                    } else {
                        // TODO: Fire error
                        console.log('Trying to assign value to missing source when creating is disabled');
                    }
                }
            }

            parentPoint = point;
            parentPart = childPart;
            point = point[childPartName];
        }

        parentPoint[childPartName] = value;
        return value;
    }


    static async runExpression(ast, processorData, timeout) {
        let result;
        let sources = {};

        for (let key of ast.sources) {
            sources[ key ] = await Executor.processor(ast[key], processorData, timeout);
        }
// console.log('expression: ===>\nleft: ast: ', ast.left, '\nvalue:', sources.left, '\nright: ', ast.right, '\nvalue: ', sources.right, '\n----- end of expression ----')

        // Yes, we should hardcode each operator separately because
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
                result = (sources.left < sources.right);
                break;

            case '<=':
                result = sources.left <= sources.right;
                break;

            case '>':
                result = (sources.left > sources.right);
                break;

            case '>=':
                result = sources.left >= sources.right;
                break;

            case '%':
                result = sources.left % sources.right;
                break;

            case '&&':
                result = sources.left && (await Executor.processor(ast.right, processorData, timeout));
                break;

            case '||':
                result = sources.left || (await Executor.processor(ast.right, processorData, timeout));
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
                break;

            case 'unary +':
                result = + sources.right;
                break;

            case 'unary -':
                result = - sources.right;
                break;

            case 'unary !':
                result = ! sources.right;
                break;

            default:
                // TODO: Fire error
                console.log(`[ERROR] Expression contains an unknown operator: "${ast.operator}".`);
        }
//console.log('runExpression: return ', result)
        return result;
    }


    static async processor(ast, processorData, timeout) {

        let result = '';
        let currentPoint;
 //       console.log('===> ast: ', JSON.stringify(ast, null, 4))
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
                result = condition ? ast.truePath : ast.falsePath;
                result = result ? await Executor.processor(result, processorData, timeout) : '';
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
                    const delimiter = (ast.delimiter)
                        ? await Executor.processor(ast.delimiter, processorData, timeout) : '';
                    let res = [];
                    for (let item of keys) {
                        await Executor.setPointerValue(
                            ast.variable,
                            { key: item, value: source[item] },
                            processorData
                        );
                        // processorData.localVars[ast.variable.value] = { key: item, value: source[item] };
                        res.push(await Executor.processor(ast.value, processorData, timeout));
                    }
                    result = res.join(delimiter);
                } else {
                    if (ast.empty) {
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

            case 'multi_expression':
                for (let expr of ast.value) {
                    result = await Executor.processor(expr, processorData, timeout);
                }
                break;

            case 'pointer':
                result = await Executor.getPointerValue(ast, processorData);
                break;

            case 'literal':
                result = ast.value;
                break;

            default:
                console.log(`Don't implemented: "${ast.type}" :(`);
        }

        return result;
    }

}


module.exports = Executor;
