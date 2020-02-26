/**
 * Lib "all-templates"
 * ControlTree: a class for the parser results building.
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';


const ControlNode  = require('./control_node');
const ControlBlock = require('./control_block');
const { LEXEME_TYPE, NODE_TYPE, NODE_STATUS, OPERATOR, OP_VALUES } = require('../constants/internal_definitions');
const { Exceptions, ErrorName, Throw } = require('../exceptions');
const { chunkString } = require('../utils/general');


class ControlTree {
    constructor(processor, renderData) {
        this.processor = processor;
        this.renderData = renderData;

        this.rootBlock = this.currentBlock = new ControlBlock(null, this, 'root');
        this.operatorsToChecking = [];
        this.nodeIndex = 0;
    }


    addToTree(lexeme, phBoundaries) {
        let node, operator;

        if (lexeme.getType() === LEXEME_TYPE.TEXT) {
            node = new ControlNode(NODE_TYPE.TEXT, lexeme, this, this.nodeIndex++);
            this.currentBlock.addNode(node);

        } else {
            operator = lexeme.getValue().toLocaleLowerCase();

            if (! OP_VALUES.includes(operator) || (lexeme.getType() !== LEXEME_TYPE.REGULAR)) {
                node = new ControlNode(OPERATOR.INSERT, lexeme, this, this.nodeIndex++)
                    .pushPlaceholder(phBoundaries);
                this.currentBlock.addNode(node);
            }
            else if (operator === OPERATOR.INSERT) {
                node = new ControlNode(OPERATOR.LONG_INSERT, lexeme, this, this.nodeIndex++)
                    .pushPlaceholder(phBoundaries);
                this.currentBlock.addNode(node);

            } else if (operator === OPERATOR.IF) {
                node = new ControlNode(OPERATOR.IF, lexeme, this, this.nodeIndex++)
                    .pushPlaceholder(phBoundaries);
                this.currentBlock.addNode(node);
                node.initIfUnlessNode(false);

            } else if (operator === OPERATOR.UNLESS) {
                node = new ControlNode(OPERATOR.IF, lexeme, this, this.nodeIndex++)
                    .pushPlaceholder(phBoundaries);
                this.currentBlock.addNode(node);
                node.initIfUnlessNode(true);

            } else if (operator === OPERATOR.ELSE) {
                const parent = this.currentBlock.getParent();
                if (parent) {
                    parent.switchToElsePath().pushPlaceholder(phBoundaries);
                } else {
                    this.processor.addErrorIfNone('ELSE_WITHOUT_IF_UNLESS', [ phBoundaries ]);
                }

            } else if (operator === OPERATOR.END) {
                const parent = this.currentBlock.getParent();
                if (parent) {
                    parent.finalizeIfUnless().pushPlaceholder(phBoundaries);
                } else {
                    this.processor.addErrorIfNone('END_WITHOUT_IF_UNLESS', [ phBoundaries ]);
                }
            } else {
                this.processor.addError({ name: 'INTERNAL_PARSER_ERROR', code: 'Unknown operator'});
            }
        }
    }


    addToOpsToChecking(controlNode) {
        this.operatorsToChecking.push(controlNode);
    }


    setCurrentBlock(controlBlock) {
        this.currentBlock = controlBlock;
    }


    getRootBlock() {
        return this.rootBlock;
    }

    checkForUnterminatedOps() {
        if (this.operatorsToChecking.length > 0) {
            for (const node of this.operatorsToChecking) {
                if (node.opStatus !== NODE_STATUS.ENDED) {
                    this.processor.addError({ name: 'UNTERMINATED_OPERATOR', placeholders: node.getPlaceholders() });
                }
            }
        }
     };

}


module.exports = ControlTree;
