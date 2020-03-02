/**
 * Lib "all-templates"
 * Processor: a class for the processing of the layers.
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const ControlTree = require('./control_tree');
const Parser      = require('./parser');
const Runner      = require('./runner');


const { LEXEME_TYPE, NODE_TYPE, NODE_STATUS, OPERATOR, OP_VALUES } = require('../constants/internal_definitions');
const { Exceptions, ErrorName, Throw } = require('../exceptions');
const { chunkString } = require('../utils/general');


class Processor {
    constructor(renderData) {
        this.renderData = renderData;
        this.renderData.processor = this;
        this.controlTree = new ControlTree(this, renderData);
        this.parser = new Parser(this, renderData);
        this.errors = [];
    }


    async start() {
        this.layer = this.renderData.options.entryPoint;
        this.parser.parse();

        if (this.controlTree.getRootBlock().length !== 1) {
            this.addErrorIfNone('RUN_EP_NO_SINGLE_EXPR');
        }

        this.checkForErrors();

        return await Runner.processControlBlock(this.renderData, this.controlTree.getRootBlock());
    }


    addError(error) {
        this.errors.push(error);
    }


    addErrorIfNone(errorName, phBoundaries) {
        if (this.errors.length === 0) {
            let error = { name: errorName };
            if (phBoundaries) {
                error.placeholders = phBoundaries;
            }
            this.errors.push(error);
        }
    }


    emitError(error) {
        this.addError(error);
        this.checkForErrors();
    }


    formatSingleError(error) {
        const { options: { printError: {lineSeparator, indentation, maxWidth} } } = this.renderData;
        let err = { ...error };
        err.description = ErrorName[err.name] || '---';

        let output = chunkString(`Error: ${err.name}`, maxWidth, indentation, lineSeparator);
        delete err.name;

        if (err.placeholders) {
            for (let ph of err.placeholders) {
                output += `${lineSeparator}${indentation}${ph.printPlaceholder()}`;
            }

            delete err.placeholders;
        }

        let keys = Object.keys(err);
        for (let key of keys) {
            output += lineSeparator
                + chunkString(`${indentation}${key}: ${err[key]}`, maxWidth, indentation, lineSeparator);
        }
        output += lineSeparator;
        return output;
    }


    checkForErrors() {
        const { options: { printError: {lineSeparator, indentation, maxWidth} } } = this.renderData;
        let output = '';

        for (let error of this.errors) {
            output += this.formatSingleError(error);
        }

        if (output.length > 0) {
            output = lineSeparator + lineSeparator
                + chunkString(ErrorName.HEADER, maxWidth, indentation, lineSeparator)
                + lineSeparator
                + ( (this.layer === false)
                        ? `[Layer: "${this.getLayerName()}"]`
                        : `[String Literal "${this.layer}" which build-in into the `
                            + `"${this.getLayerName()}"]`
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
            output += 'no errors'
        }

        output += `${this.LF}${this.LF}` + this.printDebugBlock(this.controlTree.getRootBlock(), '');

        Throw(
            Exceptions.DEBUG,
            output
        );
    }


    printDebugBlock(block, indent) {
        if (! block) {
            return '---';
        }
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
            output += `${prefix}nodeType: ${node.getNodeType()}`;
            output += `${prefix}opStatus: ${node.getOpStatus()}`;
            output += `${prefix}data: ${this.printDebugLexeme(node.getData(), newIndent)}`;
            output += `${prefix}truePath: ${this.printDebugBlock(node.getTruePath(), newIndent)}`;
            output += `${prefix}falsePath: ${this.printDebugBlock(node.getFalsePath(), newIndent)}`;
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


module.exports = Processor;