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
    constructor(renderData, layerName, layer) {
        this.rootBlock = this.currentBlock = new ControlBlock(null, this, 'root');
        this.operatorsToChecking = [];
        this.errors = [];
        this.renderData = renderData;
        this.layerName = layerName;
        this.layer = layer;
        this.nodeIndex = 0;
        this.blockIndex = 0;
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
                node.initInsertNode();
            }
            else if (operator === OPERATOR.INSERT) {
                node = new ControlNode(OPERATOR.LONG_INSERT, lexeme, this, this.nodeIndex++)
                    .pushPlaceholder(phBoundaries);
                this.currentBlock.addNode(node);
                node.initInsertNode();

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
                    this.addErrorIfNone('ELSE_WITHOUT_IF_UNLESS', phBoundaries);
                }

            } else if (operator === OPERATOR.END) {
                const parent = this.currentBlock.getParent();
                if (parent) {
                    parent.finalizeIfUnless().pushPlaceholder(phBoundaries);
                } else {
                    this.addErrorIfNone('END_WITHOUT_IF_UNLESS', phBoundaries);
                }

            } else {
                this.addError({ name: 'INTERNAL_PARSER_ERROR', code: 'Unknown operator'});
            }


            //node.pushPlaceholder(phBoundaries);
        }
    }

    addToOpsToChecking(controlNode) {
        this.operatorsToChecking.push(controlNode);
    }

    setCurrentBlock(controlBlock) {
        this.currentBlock = controlBlock;
    }

    addError(error) {
        this.errors.push(error);
    }

    addErrorIfNone(errorName, phBoundaries) {
        if (this.errors.length === 0) {
            let error = { name: errorName };
            if (phBoundaries) {
                error.placeholder = phBoundaries;
            }
            this.errors.push(error);
        }
    }

    getRootBlock() {
        return this.rootBlock;
    }

    formatSingleError(error) {
        const { options: { printError: {lineSeparator, indentation, maxWidth} } } = this.renderData;
        let err = { ...error };
        err.description = ErrorName[err.name] || '---';

        let output = chunkString(`Error: ${err.name}`, maxWidth, indentation, lineSeparator) + lineSeparator;
        delete err.name;

        let keys = Object.keys(err);
        for (let key of keys) {
            output += chunkString(`${indentation}${key}: ${err[key]}`, maxWidth, indentation, lineSeparator)
                + lineSeparator;
        }
        output += lineSeparator;
        return output;
    }

    checkForErrors() {
        const { options: { printError: {lineSeparator, indentation, maxWidth} } } = this.renderData;
        let output = '';

        if (this.operatorsToChecking.length > 0) {
console.log('opsToCheck: \n', this.operatorsToChecking, '\n++++++++++++')
            for (const node of this.operatorsToChecking) {
                if (node.opStatus !== NODE_STATUS.ENDED) {
                    this.errors.push({ name: 'UNTERMINATED_OPERATOR', node });
                }

            }

        }

        for (let error of this.errors) {
            if (error.placeholder) {
                error.placeholder = error.placeholder.getPlaceholder();
            }
            if (error.node) {
                let phNumber = ' ';
                for (let ph of error.node.getPlaceholders()) {
                    error[`placeholder ${phNumber++}`] = ph.getPlaceholder();
                }
                delete error.node;
            }
            output += this.formatSingleError(error);
        }

        if (output.length > 0) {
            output = lineSeparator + lineSeparator
                + lineSeparator + chunkString(ErrorName.HEADER, maxWidth, indentation, lineSeparator)
                + lineSeparator
                + ( (this.layer === false)
                        ? `[Layer: "${this.layerName}"]`
                        : `[String Literal "${this.layer}" which build-in into the "${this.layerName}"]`
                )
                + `${lineSeparator}${lineSeparator}${output}`;
            Throw(Exceptions.PARSING_ERRORS, output);
        }
    };

    printDebug() {
        this.LF = this.renderData.options.printError.lineSeparator;
        this.INDENT = this.renderData.options.printError.indentation.repeat(2);

        let output = `${this.LF}${this.LF}Errors: `;
        if (this.errors.length > 0) {
            for (let error of this.errors) {
                output += this.formatSingleError(error);
            }
        } else {
            output += '---'
        }

        output += `${this.LF}${this.LF}` + this.printDebugBlock(this.rootBlock, '');

        Throw(
            Exceptions.DEBUG,
            output
        );
    }

    printDebugBlock(block, indent) {
        let prefix = `${this.LF}${indent}`;
        let output = `${prefix}[${block.getName()}]  `
            + `parent: ${this.printName(block.getParent())}`;
        let newIndent = `${indent}${this.INDENT}`;
        for (let node of block.getNodes()) {
            output += this.printDebugNode(node, newIndent) + `${this.LF}${this.LF}`;
        }
        return output;
    }

    printDebugNode(node, indent) {
        let output;
        if (node) {
            let prefix = `${this.LF}${indent}`;
            let newIndent = `${indent}${this.INDENT}`;
            output = `${prefix}[${node.getName()}]`;
            output += `${prefix}data: ${this.printDebugLexeme(node.getData(), newIndent)}`;
        } else {
            output = '---';
        }

        return output;
    }

    printDebugLexeme(lexeme, indent) {
        let output;
        if (lexeme) {
            let newIndent = `${indent}${this.INDENT}`;
            let prefix = `${this.LF}${indent}`;
            output = `${prefix}[${lexeme.getName()}]`
                + `${prefix}value:      '${lexeme.getValue()}'`
                + `${prefix}type:       ${lexeme.getType()}`
                + `${prefix}kind:       ${lexeme.getKind()}`
                + `${prefix}species:    ${lexeme.getSpecies()}`
                + `${prefix}terminator: '${lexeme.getTerminator()}'`
                + `${prefix}insertType: ${lexeme.getInsertType()}`
                + `${prefix}parent:     ${this.printName(lexeme.getParent())}`
                + `${prefix}prev:       ${this.printName(lexeme.getPrev())}`
                + `${prefix}next:       ${this.printDebugLexeme(lexeme.getNext(), newIndent)}`
                + `${prefix}child:      ${this.printDebugLexeme(lexeme.getChild(), newIndent)}`
                + `${prefix}firstArg:   ${this.printDebugLexeme(lexeme.getFirstArg(), newIndent)}`;
        } else {
            output = '---'
        }
        return output;
    }

    printName(entity) {
        return entity ? entity.getName() : '---';
    }
}


module.exports = ControlTree;
