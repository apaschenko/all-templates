/**
 * Lib "all-templates"
 * Processor: a main class for the processing of the layers.
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const ControlTree = require('./control_tree');
const Parser      = require('./parser');
const Starter     = require('./starter');

const { LEXEME_TYPE, NODE_TYPE, NODE_STATUS } = require('../constants/internal_definitions');
const { Exceptions, ErrorName, Throw } = require('../exceptions');
const { chunkString } = require('../utils/general');


class Processor extends Starter {
    constructor(renderData) {
        super(renderData);
    }


    async processBlock(block) {
        const {options: {debug}} = this.renderData;

        let result = '';
        for (let node of block.getNodes()) {
            result += await this.processNode(node);
        }

        return result;
    }


    async processNode(node) {
        let result;

        switch (node.getNodeType()) {
            case NODE_TYPE.TEXT:
                result = node.getData().getValue();
                break;
            case NODE_TYPE.INSERT:
                result = this.processChain(node.getData().getValue());
                break;

                // TODO
        }
    }


    async processChain(chain) {

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
        // TODO!
    }

}


module.exports = Processor;
