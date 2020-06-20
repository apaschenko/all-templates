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

        for (let pointerPart of ast.value) {
            if ('object' === typeof timeout) {
                if (timeout.hasOwnProperty(pointerPart.value)) {
                    timeout = timeout[value];
                } else if (timeout.hasOwnProperty('*')) {
                    timeout = timeout['*'];
                }
            }
            if ('object' === typeof result) {
                result = await Executor.processor(pointerPart, processorData, timeout);
            } else {
                // TODO: fire error
                console.log(`It's not an Object!`);
            }
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

            case 'pointer':
                // find a value and find a timeout for the functions
                timeout = timeout || processorData.options.timeout;
                currentPoint = processorData.point;
                processorData.point = ('data' === ast.source) ? processorData.data : processorData.localVars;
                for (let idPart of ast.value) {
                    if ('object' === typeof timeout) {
                        if (timeout.hasOwnProperty(idPart.value)) {
                            timeout = timeout[value];
                        } else if (timeout.hasOwnProperty('*')) {
                            timeout = timeout['*'];
                        }
                    }
                    if ('object' !== typeof processorData.point) {
                        // TODO: fire error
                        console.log(`It's not an Object!`);
                    } else {
                        processorData.point =
                            await Executor.processor(idPart, processorData, timeout);
                    }
                }

                result = processorData.point;
                processorData.point = currentPoint;
                break;

            case 'function':
                let args = [];
                currentPoint = processorData.point;
                for (let argAst of ast.args) {
                    processorData.point = processorData.data;
                    const argValue = await Executor.processor(argAst, processorData, timeout);
                    args.push(argValue);
                }
                processorData.point = currentPoint;
                const func = processorData.point[value];
                if ('function' !== typeof func) {
                    // TODO: fire error
                    console.log(`${value} not found or not a function`);
                }
                result = await utils.asyncCall(func, args, processorData, timeout);

                break;

            case 'regular':
            case 'integer':
                if (processorData.point.hasOwnProperty(ast.value)) {
                    result = processorData.point[ast.value];
                    if ('function' === typeof result) {
                        result = await utils.asyncCall(result, [], processorData, timeout);
                    }
                } else {
                    // TODO: Fire error
                    console.log(`Missing key: "${ast.value}"`);
                }
                break;

            case 'need_to_parse':
                result = await Executor.processor(ast.value, processorData, timeout);
                result = await Executor.parseAndProcessSource(result, 'Layer', processorData, timeout);
                break;

            default:
                console.log(`Don't implemented: "${ast.type}" :(`);
        }
        console.log('===> result: ', JSON.stringify(result, null, 4), '\n===> typeof result: ', typeof result)
        return result;
    }

}


module.exports = Executor;
