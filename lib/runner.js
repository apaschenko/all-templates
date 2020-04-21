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


async function processor(ast, processorData, localVars, enableParsing = true) {
    let result = '';

    switch (ast.type) {
        case 'layer':
            for (let element of ast.value) {
                let textHasBeenAdded = false;
                if (element.text) {
                    processorData.tags.push(element.text);
                    textHasBeenAdded = true;
                }
                result += await processor(element, processorData, localVars, enableParsing);
                if (textHasBeenAdded) {
                    processorData.tags.pop();
                }
            }
            break;

        case  'text':
            result = ast.value;
            break;

        case 'tag_if':
            const condition = await processor(ast.value, processorData, localVars, enableParsing);
            result = await processor(
                condition ? ast.truePath : ast.falsePath,
                processorData,
                localVars,
                enableParsing
            );
            break;

        case 'tag_insert':
            result = await processor(ast.value, processorData, localVars, enableParsing);
            if (enableParsing) {
                const newLayerAst = parser.parse(result);
                result = await processor(newLayerAst, processorData, localVars, enableParsing);
            }
            break;

        case 'tag_for':
            if (ast.init) {
                await processor(ast.init, processorData, localVars, enableParsing);
            }
            while (await processor(ast.cond, processorData, localVars, enableParsing)) {
                if (ast.cond) {
                    result += await processor(ast.value, processorData, localVars, enableParsing);
                }
                if (ast.after) {
                    await processor(ast.after, processorData, localVars, enableParsing);
                }
            }
            break;

        case 'tag_each':
            let source = await processor(ast.source, processorData, localVars, enableParsing);
            if ('object' !== typeof source) {
                source = [];
            }
            const keys = Object.keys(source);
            if (keys.length > 0) {
                const delimiter = (ast.delimiter && ast.delimiter.length)
                    ? await processor(ast.delimiter, processorData, localVars, enableParsing) : '';
                let res = [];
                for (let item of keys) {
                    localVars[ast.variable.value] = { key: item, value: source[item] };
                    res.push(await processor(ast.value, processorData, localVars, enableParsing));
                }
                result = res.join(delimiter);
            } else {
                if (ast.empty && ast.empty.length) {
                    result = await processor(ast.empty, processorData, localVars, enableParsing);
                }
            }
            break;

        case 'tag_while':
            while (await processor(ast.expression, processorData, localVars, enableParsing)) {
                result += await processor(ast.layer, processorData, localVars, enableParsing);
            }
            break;

        case 'tag_do_while':
            do {
                result += await processor(ast.layer, processorData, localVars, enableParsing);
            } while (await processor(ast.expression, processorData, localVars, enableParsing))
            break;

        case 'tag_set':
            await processor(ast.expression, processorData, localVars, enableParsing);
            break;

        case 'tag_comment':
            break;
    }

    return result;
}


module.exports = processor;
