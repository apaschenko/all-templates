/**
 * Lib "all-templates"
 * ControlNode: a class for the parser results construction.
 * It represents a single node (text chunk or an operator).
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const ControlBlock    = require('./control_block');
const { NODE_STATUS } = require('../constants/internal_definitions');


class ControlNode {
    constructor(nodeType, lexeme, controlTree, name) {
        this.nodeType     = nodeType;
        this.data         = lexeme;
        this.controlTree  = controlTree;
        this.name         = `node #${name}`;
        this.placeholders = [];
        return this;
    }

    setBlock(controlBlock) {
        this.block = controlBlock;
        return this;
    }

    getBlock() {
        return this.block;
    }

    getData() {
        return this.data;
    }

    getNodeType() {
        return this.nodeType;
    }

    getName() {
        return this.name;
    }

    getTruePath() {
        return this.truePath;
    }

    getFalsePath() {
        return this.falsePath;
    }

    pushPlaceholder(phBoundaries) {
        this.placeholders.push(phBoundaries);
        return this;
    }

    getPlaceholders() {
        return this.placeholders;
    }

    getOpStatus() {
        return this.opStatus;
    }

    initIfUnlessNode(isNeedToRevert) {
        let controlTree = this.controlTree;
        this.truePath = new ControlBlock(this, controlTree, `truePath of ${this.name}`);
        this.falsePath = new ControlBlock(this, controlTree, `falsePath of ${this.name}`);
        this.opStatus = NODE_STATUS.THEN;
        this.isNeedToRevert = isNeedToRevert;
        controlTree.setCurrentBlock(isNeedToRevert ? this.falsePath : this.truePath);
        controlTree.addToOpsToChecking(this);
    }

    initInsertNode() {
        this.opStatus = NODE_STATUS.ENDED;
        this.controlTree.addToOpsToChecking(this);
    }

    setIndexToChecking(index) {
        this.indexToChecking = index;
    }

    switchToElsePath() {
        let newPath;
        switch (this.opStatus) {
            case NODE_STATUS.THEN:
                this.controlTree.setCurrentBlock(this.isNeedToRevert ? this.truePath : this.falsePath);
                this.opStatus = NODE_STATUS.ELSE;
                break;
            case NODE_STATUS.ELSE:
                this.controlTree.addErrorIfNone('FLOW_TWO_ELSE_IN_ROW', this.placeholders);
                break;
            case NODE_STATUS.ENDED:
                this.controlTree.addError({ name: 'INTERNAL_PARSER_ERROR', code: 'Illegal operator status'});
                break;
        }

        return this;
    }

    finalizeIfUnless() {
        this.opStatus = NODE_STATUS.ENDED;
        this.controlTree.setCurrentBlock(this.block);
        return this;
    }
}


module.exports = ControlNode;
