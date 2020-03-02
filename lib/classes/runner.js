/**
 * Lib "all-templates"
 * Runner: a class for the processing of the layers.
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const ControlTree = require('./control_tree');
const Parser      = require('./parser');


const { LEXEME_TYPE, NODE_TYPE, NODE_STATUS, OPERATOR, OP_VALUES } = require('../constants/internal_definitions');
const { Exceptions, ErrorName, Throw } = require('../exceptions');
const { chunkString } = require('../utils/general');


class Runner {
    static async processControlBlock(renderData, controlBlock) {
        const {options: {debug}} = renderData;

        let result = '';
        for (let controlNode of controlBlock.getNodes()) {
            result += await Runner.processControlNode(renderData, controlNode);
        }

        return result;
    }


    static async processControlNode(renderData, controlNode) {
        let result;
        const firstLexeme = controlNode.getData();

        switch (controlNode.getNodeType()) {
            case NODE_TYPE.TEXT:
                result = firstLexeme.getValue();
                break;
            case NODE_TYPE.INSERT:
                Runner.checkWrongNumOfParts(renderData, controlNode, firstLexeme, true);
                result = await this.processLexemes(renderData, controlNode, firstLexeme);
                break;

            case NODE_TYPE.LONG_INSERT:
                Runner.checkWrongNumOfParts(renderData, controlNode, firstLexeme, false);
                const secondLexeme = firstLexeme.getNext();
                Runner.checkWrongNumOfParts(renderData, controlNode, firstLexeme, true);
                result = await this.processLexemes(renderData, controlNode, secondLexeme);

            // TODO
        }

        return result;
    }


    static async processLexemes(renderData, controlNode, lexemes) {

    }

    static checkWrongNumOfParts(renderData, controlNode, lexeme, isCheckForSurplus) {
        if (isCheckForSurplus === !!lexeme.getNext()) {
            renderData.processor.emitError({
                name: isCheckForSurplus ? 'RUN_TOO_MANY_PARTS' : 'RUN_TOO_FEW_PARTS',
                placeholders: controlNode.getPlaceholders()
            });
        }
    }


    async getNode(currentData, nodeName) {
        // A trying to get the node
        if (currentData instanceof Map) {
            for (let candidateKey of dataKeys) {
                if (candidateKey instanceof RegExp) {
                    if (candidateKey.test(layerName)) {
                        layerValue = currentData.get(candidateKey);
                        layerRealName = candidateKey;
                        break;
                    }
                } else if (candidateKey === layerName) {
                    layerValue = currentData.get(candidateKey);
                    layerRealName = candidateKey;
                    break;
                }
            }
        } else {
            layerValue = currentData[layerName];
        }

    }


    getLayerName() {
        return this.renderData.options.entryPoint;
    }

}


module.exports = Runner;
