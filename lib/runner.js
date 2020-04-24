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


async function processor(ast, processorData, point = processorData.data, enableParsing = false) {
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
                result += await processor(element, processorData, result, enableParsing);
                if (textHasBeenAdded) {
                    processorData.tags.pop();
                }
            }
            break;

        case  'text':
            result = ast.value;
            break;

        case 'tag_if':
            const condition = await processor(ast.value, processorData, enableParsing);
            result = await processor(
                condition ? ast.truePath : ast.falsePath,
                processorData,
                result,
                enableParsing
            );
            break;

        case 'tag_insert':
            result = await processor(ast.value, processorData, result, enableParsing);
            break;

        case 'tag_for':
            if (ast.init) {
                await processor(ast.init, processorData, result, enableParsing);
            }
            while (await processor(ast.cond, processorData, result, enableParsing)) {
                if (ast.cond) {
                    result += await processor(ast.value, processorData, result, enableParsing);
                }
                if (ast.after) {
                    await processor(ast.after, processorData, enableParsing);
                }
            }
            break;

        case 'tag_each':
            let source = await processor(ast.source, processorData, result, enableParsing);
            if ('object' !== typeof source) {
                source = [];
            }
            const keys = Object.keys(source);
            if (keys.length > 0) {
                const delimiter = (ast.delimiter && ast.delimiter.length)
                    ? await processor(ast.delimiter, processorData, result, enableParsing) : '';
                let res = [];
                for (let item of keys) {
                    processorData.localVars[ast.variable.value] = { key: item, value: source[item] };
                    res.push(await processor(ast.value, processorData, result, enableParsing));
                }
                result = res.join(delimiter);
            } else {
                if (ast.empty && ast.empty.length) {
                    result = await processor(ast.empty, processorData, result, enableParsing);
                }
            }
            break;

        case 'tag_while':
            while (await processor(ast.expression, processorData, result, enableParsing)) {
                result += await processor(ast.layer, processorData, result, enableParsing);
            }
            break;

        case 'tag_do_while':
            do {
                result += await processor(ast.layer, processorData, result, enableParsing);
            } while (await processor(ast.expression, processorData, result, enableParsing))
            break;

        case 'tag_set':
            await processor(ast.expression, processorData, result, enableParsing);
            break;

        case 'tag_empty':
            break;

        case 'id':
            result = processorData.data;
            for (let item of ast.value) {
                if ('object' !== typeof result) {
                    // TODO: fire error
                    console.log(`It's not an Object!`);
                } else {
                    result = await processor(item, processorData, result, false);
                }
            }
            if (enableParsing) {
                const newLayerAst = parser.parse(result);
                console.log('===> needToParse: parse id: ' , JSON.stringify(newLayerAst, null, 4))
                result = await processor(newLayerAst, processorData, processorData.data, enableParsing);
            }
            break;

        case 'regular':
            if (point.hasOwnProperty(ast.value)) {
                result = point[ast.value];
console.log('===> id result: ', result, ', typeof result: ', typeof result)
                if ('function' === typeof result) {
                    // TODO: implement function processing!
                }
            } else {
                // TODO: Fire error
                console.log(`Missing key: "${ast.value}"`);
            }
            break;

        case 'need_to_parse':
            result = await processor(ast.value, processorData, processorData.data, true);
            break;

        default:
            console.log(`Don't implemented: "${ast.type}" :(`);
    }
console.log('===> result: ', JSON.stringify(result, null, 4), '\n===> typeof result: ', typeof result)
    return result;
}


module.exports = processor;
