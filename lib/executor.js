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


async function parseAndProcessSource(source, startRule, processorData, enableParsing, timeout) {
    let result;

    let entryPointAst = utils.syncCall(
        parser.parse,
        [source, { startRule }],
        E.error['PARSING_ERROR'],
        options
    );

    const currentPoint = processorData.point;
    processorData.point = processorData.data;
    result = await processor(entryPointAst, processorData, enableParsing, timeout);
    processorData.point = currentPoint;

    return result;
}


async function processor(ast, processorData, enableParsing = false, timeout) {

    let result = '';
console.log('===> ast: ', JSON.stringify(ast, null, 4))
    switch (ast.type) {
        case 'layer':
            for (let element of ast.value) {
                let textHasBeenAdded = false;
                if (element.text) {
                    processorData.tags.push(element.text);
                    textHasBeenAdded = true;
                }
                result += await processor(element, processorData, enableParsing, timeout);
                if (textHasBeenAdded) {
                    processorData.tags.pop();
                }
            }
            break;

        case  'text':
            result = ast.value;
            break;

        case 'tag_if':
            const condition = await processor(ast.value, processorData, enableParsing, timeout);
            result = await processor(
                condition ? ast.truePath : ast.falsePath,
                processorData,
                enableParsing,
                timeout
            );
            break;

        case 'tag_insert':
            result = await processor(ast.value, processorData, enableParsing, timeout);
            break;

        case 'tag_for':
            if (ast.init) {
                await processor(ast.init, processorData, enableParsing, timeout);
            }
            while (await processor(ast.cond, processorData, enableParsing, timeout)) {
                if (ast.cond) {
                    result += await processor(ast.value, processorData, enableParsing, timeout);
                }
                if (ast.after) {
                    await processor(ast.after, processorData, enableParsing, timeout);
                }
            }
            break;

        case 'tag_each':
            let source = await processor(ast.source, processorData, enableParsing, timeout);
            if ('object' !== typeof source) {
                source = [];
            }
            const keys = Object.keys(source);
            if (keys.length > 0) {
                const delimiter = (ast.delimiter && ast.delimiter.length)
                    ? await processor(ast.delimiter, processorData, enableParsing, timeout) : '';
                let res = [];
                for (let item of keys) {
                    processorData.localVars[ast.variable.value] = { key: item, value: source[item] };
                    res.push(await processor(ast.value, processorData, enableParsing, timeout));
                }
                result = res.join(delimiter);
            } else {
                if (ast.empty && ast.empty.length) {
                    result = await processor(ast.empty, processorData, enableParsing, timeout);
                }
            }
            break;

        case 'tag_while':
            while (await processor(ast.expression, processorData, enableParsing, timeout)) {
                result += await processor(ast.layer, processorData, enableParsing, timeout);
            }
            break;

        case 'tag_do_while':
            do {
                result += await processor(ast.layer, processorData, enableParsing, timeout);
            } while (await processor(ast.expression, processorData, enableParsing, timeout));
            break;

        case 'tag_set':
            await processor(ast.expression, processorData, enableParsing, timeout);
            break;

        case 'tag_empty':
            break;

        case 'id':
            // find a value and find a timeout for the functions
            timeout = timeout || processorData.options.timeout;
            processorData.point = processorData.data;
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
                    processorData.point = await processor(idPart, processorData, false, timeout);
                }
            }

            result = processorData.point;

            if (enableParsing) {
                result =
                    await parseAndProcessSource(result, 'Layer', processorData, enableParsing, timeout);
             }
            break;

        case 'function':
            let arguments = [];
            const currentPoint = processorData.point;
            for (let argAst of ast.args) {
                processorData.point = processorData.data;
                const argValue = await processor(argAst, processorData, false, timeout);
                arguments.push(argValue);
            }
            processorData.point = currentPoint;
            const func = processorData.point[value];
            if ('function' !== typeof func) {
                // TODO: fire error
                console.log(`${value} not found or not a function`);
            }
            result = await utils.asyncCall(func, arguments, processorData, timeout);

            break;

        case 'pointer':
            result = await processor(ast.value, processorData, false, timeout);
            result = await parseAndProcessSource(result, 'Id', processorData, enableParsing, timeout);
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
            result = await processor(ast.value, processorData, true, timeout);
            break;

        default:
            console.log(`Don't implemented: "${ast.type}" :(`);
    }
console.log('===> result: ', JSON.stringify(result, null, 4), '\n===> typeof result: ', typeof result)
    return result;
}


module.exports = {
    parseAndProcessId: parseAndProcessSource,
    processor
};
