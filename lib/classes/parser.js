/**
 * Lib "all-templates"
 * Root class of Layer parser
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const ControlTree  = require('./control_tree');
const Lexeme       = require('./lexeme');
const PhBoundaries = require('./placeholder_boundaries');

const {
    SYMBOL: {
        BLANKS,
        QUOTES,
        A_QUOTE,
        OPEN_SQR_BRACKET,
        CLOSE_SQR_BRACKET,
        OPEN_PARENTHESIS,
        CLOSE_PARENTHESIS,
        DOT,
        COMMA,
        CARET,
        DIGITS,
        HASH,
        EQUALS,
        ASTERISK
    },
    DELIMITER,
    LEXEME_TYPE,
    LEXEME_KIND,
    LEXEME_SPECIES
} = require('../constants/internal_definitions');


const STATUS = {
    TEXT      : 'text',
    PH_REGULAR: 'regular',
    PH_STRING : 'string',
    PH_NUMBER : 'number',
    PH_COMMENT: 'comment'
};

const LEVEL_REMOVING_DELIMITERS = [
    CLOSE_SQR_BRACKET,
    CLOSE_PARENTHESIS
];

const PAIRED_DELIMITERS = {
    CLOSE_SQR_BRACKET: OPEN_SQR_BRACKET,
    CLOSE_PARENTHESIS: OPEN_PARENTHESIS
};

const SWALLOWED_DELIMITERS = [
    DELIMITER.NONE,
    DELIMITER.BLANK
];

const REGULAR_DELIMITERS = [
    OPEN_SQR_BRACKET,
    OPEN_PARENTHESIS,
    DOT,
    COMMA
];

const INSERT_TYPE = {
    ROOT     : 'root',
    SIBLING  : 'sibling',
    FIRST_ARG: 'first arg',
    CHILD    : 'child'
};

const CLOSING_STATUS = {
    CONTINUE     : 'continue',
    PH_CLOSED    : 'closed',
    MAYBE_CLOSING: 'maybe'

};

class Parser {
    constructor(processor, renderData) {
        this.processor = processor;
        this.renderData = renderData;
        this.buffer = '';
        this.result = '';
        this.levels = null;
        this.lastCheckedPos = -1;
        this.currentLexeme = false;
        this.delimiter = DELIMITER.TEXT_STARTED;
        this.controlTree = processor.getControlTree();
        this.lexemeIndex = 0;

        return this;
    }

    getRenderData() {
        return this.renderData;
    }

    addLexToCurLevel(lexeme) {
        this.levels[this.levels.length - 1].lexemes.push(lexeme);
    }

    addLexToNewLevel(lexeme, delimiter) {
        this.levels.push({ delimiter: delimiter, lexemes: [lexeme] });
    }

    getLastChain() {
        const lexemes = (this.levels.length > 0) ? this.levels[this.levels.length - 1].lexemes : [];
        return (lexemes.length > 0) ? lexemes[lexemes.length - 1] : null;
    }

    getLastLexeme() {
        let lexeme = this.getLastChain();
        while (lexeme && lexeme.getChild()) {
            lexeme = lexeme.getChild();
        }
        return lexeme;
    }

    insertLexeme () {
        const lexeme = this.currentLexeme;
        let relatedLexeme;

        // First: insert the lexeme
        if (lexeme) {
            if (lexeme.isNotEmpty()) {
                lexeme.setName(this.lexemeIndex++); // to the debug purpose
                switch (lexeme.getInsertType()) {
                    case INSERT_TYPE.CHILD:
                        relatedLexeme = this.getLastLexeme();
                        if (! relatedLexeme || relatedLexeme.getType() === LEXEME_TYPE.TEXT) {
                            this.error = this.error || {
                                name: 'PH_CHILD_WITHOUT_PARENT',
                                lexeme: lexeme.getValue()
                            }
                        }
                        lexeme.setParent(relatedLexeme);
                        relatedLexeme.setChild(lexeme);
                        break;

                    case INSERT_TYPE.FIRST_ARG:
                        relatedLexeme = this.getLastLexeme();
                        if (relatedLexeme) {
                            lexeme.setParent(relatedLexeme);
                            relatedLexeme.setFirstArg(lexeme);
                            if (relatedLexeme.getType() !== LEXEME_TYPE.POINTER) {
                                relatedLexeme.setSpecies(LEXEME_SPECIES.FUNCTION);
                            }
                            this.addLexToNewLevel(lexeme);
                        } else {
                            this.error = this.error || {
                                name: 'PH_ARG_WITHOUT_FUNC_NAME',
                                symbols: lexeme.getValue()
                            };
                        }
                        break;

                    case INSERT_TYPE.ROOT:
                        this.controlTree.addToTree(lexeme, this.phBoundaries);

                        if (lexeme.getType() !== LEXEME_TYPE.TEXT) {
                            this.addLexToNewLevel(lexeme, DELIMITER.BLANK);
                        }
                        break;

                    case INSERT_TYPE.SIBLING:
                        relatedLexeme = this.getLastChain();
                        lexeme.setPrev(relatedLexeme);
                        relatedLexeme.setNext(lexeme);
                        this.addLexToCurLevel(lexeme);
                        break;
                }

            } else {
                if ((lexeme.getType() !== LEXEME_TYPE.TEXT) && (lexeme.getSpecies() !== LEXEME_SPECIES.ARG_OF_FUNC)) {
                    this.error = this.error || { name: 'PH_TWO_DELIMITERS_IN_ROW' };
                }
            }
        }

        // Second: correct levels if necessary
        if (this.removingDelimiter) {
            if (this.levels.length > 1) {
                let lastLevel = this.levels.pop();
                if (lastLevel.delimiter !== PAIRED_DELIMITERS[this.removingDelimiter]) {
                    this.error = this.error || {
                        name   : 'PH_UNBALANCED_BRACKETS',
                        symbols: `"${lastLevel.delimiter} ... ${this.removingDelimiter}"`
                    };
                }
            } else {
                this.error = this.error || {
                    name   : 'PH_UNBALANCED_BRACKETS',
                    symbols: `"${this.removingDelimiter}" is not preceded by ` +
                        `"${PAIRED_DELIMITERS[this.removingDelimiter]}"`
                };
            }

            this.removingDelimiter = null;
        }
    }

    addLexemeAndPrepareNew() {
        let prevLexeme  = this.currentLexeme;
        let newLexeme   = new Lexeme();

        // First: push a previous Lexeme into Lexical Tree
        this.insertLexeme();

        // Second: New lexeme preparing
        switch (this.delimiter) {
            case DELIMITER.TEXT_STARTED:
                newLexeme.setType(LEXEME_TYPE.TEXT).setInsertType(INSERT_TYPE.ROOT);
                break;

            case DELIMITER.NONE:
                if (prevLexeme && prevLexeme.getType() === LEXEME_TYPE.POINTER) {
                    newLexeme.setInsertType(INSERT_TYPE.FIRST_ARG);
                } else {
                    this.error = this.error || {
                        name    : 'PH_MISSING_DELIMITER',
                        location: `between "${prevLexeme.value()}" and next lexeme`
                    };
                }
                break;

            case DELIMITER.BLANK:
                prevLexeme = this.getLastChain();
                if (prevLexeme && (prevLexeme.getType() !== LEXEME_TYPE.TEXT)) {
                    if (this.levels.length > 1) {
                        this.error = this.error || {
                            name    : 'PH_BLANK_BETWEEN_NESTED_LEXEMES',
                            location: `between "${this.getLastLexeme().getValue()}" and next lexeme`
                        };
                    }
                    newLexeme.setInsertType(INSERT_TYPE.SIBLING);
                } else {
                    newLexeme.setInsertType(INSERT_TYPE.ROOT);
                }
                break;

            case DELIMITER.OPEN_PARENTHESIS:
                newLexeme.setInsertType(INSERT_TYPE.FIRST_ARG)
                    .setSpecies(LEXEME_SPECIES.ARG_OF_FUNC)
                    .setParent(prevLexeme);
                break;

            case DELIMITER.DOT:
                newLexeme.setInsertType(INSERT_TYPE.CHILD);
                break;

            case DELIMITER.OPEN_SQR_BRACKET:
                newLexeme.setInsertType(INSERT_TYPE.CHILD).setKind(LEXEME_KIND.EL_OF_ARRAY);
                break;

            case DELIMITER.COMMA:
                newLexeme.setInsertType(INSERT_TYPE.SIBLING).setSpecies(LEXEME_SPECIES.ARG_OF_FUNC);
                const lastChain = this.getLastChain();
                if (!lastChain || (lastChain.getSpecies() !== LEXEME_SPECIES.ARG_OF_FUNC)) {
                    this.error = this.error || {
                        name: 'PH_UNEXPECTED_COMMA',
                        location: `between "${this.getLastLexeme().getValue()}" and next lexeme`
                    };
                }
                break;
        }

        this.currentLexeme = newLexeme;
    }

    prepareTextLexeme() {
        this.currentLexeme.setValue(this.result)
            .setType(LEXEME_TYPE.TEXT)
            .setInsertType(INSERT_TYPE.ROOT);
    }

    parse() {
        const { options: { placeholder, escapeSymbol } } = this.renderData;
        this.posInLayer = 0;
        this.status = STATUS.TEXT;

        this.currentLexeme = new Lexeme();

        const layerLength = this.processor.layer.length;
        let lexemeNotStarted;
        let ignoreBlanks;
        let escaping = false;

        let {openPhMaxPosition, closePhMaxPosition} = this.renderData;

        mainLoop: while (this.posInLayer < layerLength) {
            const symbol = this.processor.layer[this.posInLayer];

            switch (this.status) {
                case STATUS.TEXT:
                    if (symbol === placeholder.open[this.buffer.length]) {
                        if (this.buffer.length === openPhMaxPosition) { // new placeholder started
                            this.phBoundaries =
                                new PhBoundaries(this, this.posInLayer + 1);
                            this.delimiter = DELIMITER.BLANK;
                            this.removingDelimiter = null;
                            ignoreBlanks = false;
                            this.prepareTextLexeme();
                            this.buffer = this.result = '';
                            this.maybeInsertOperator = lexemeNotStarted = true;
                            this.levels = [];
                            this.status = STATUS.PH_REGULAR;
                        } else {
                            this.buffer += symbol;
                        }
                    } else {
                        this.result += (this.buffer + symbol);
                        this.buffer = '';
                    }
                    break;

                case STATUS.PH_REGULAR:
                    let closingStatus = this.checkForPhClosing(symbol, closePhMaxPosition);
                    if (closingStatus === CLOSING_STATUS.PH_CLOSED) {
                        if (this.error) {
                            break mainLoop;
                        } else {
                            break;
                        }
                    }

                    if (closingStatus === CLOSING_STATUS.MAYBE_CLOSING) {
                        break;
                    }

                    if (BLANKS.includes(symbol)) {
                        if (ignoreBlanks) {
                            break;
                        }
                        if (this.delimiter === DELIMITER.NONE) {
                            this.delimiter = DELIMITER.BLANK;
                        }
                        lexemeNotStarted = true;

                    } else if (QUOTES.includes(symbol)) { // quoted lexeme is started
                        this.addLexemeAndPrepareNew();
                        this.maybeInsertOperator = false;
                        this.currentLexeme.setType(LEXEME_TYPE.STRING).setTerminator(symbol);
                        this.status = STATUS.PH_STRING;
                        ignoreBlanks = false;

                    } else if (REGULAR_DELIMITERS.includes(symbol)) {
                        if (SWALLOWED_DELIMITERS.includes(this.delimiter)) {
                            this.delimiter = symbol;
                        } else {
                            this.error = this.error || {
                                name   : 'PH_TWO_DELIMITERS_IN_ROW',
                                symbols: `"${this.delimiter}" and "${symbol}"`
                            };
                        }
                        lexemeNotStarted = true;
                        this.maybeInsertOperator = false;

                    } else if (LEVEL_REMOVING_DELIMITERS.includes(symbol)) {
                        this.removingDelimiter = symbol;
                        this.delimiter = DELIMITER.NONE;
                        lexemeNotStarted = true;
                        this.maybeInsertOperator = false;

                    } else if (symbol === CARET) {
                        this.addLexemeAndPrepareNew();
                        this.currentLexeme.setKind(LEXEME_KIND.RELATIVE);
                        this.maybeInsertOperator = false;
                        this.status = STATUS.PH_NUMBER;
                        ignoreBlanks = true;

                    } else if (symbol === ASTERISK) {
                        if (this.currentLexeme.getType() !== LEXEME_TYPE.POINTER) {
                            this.addLexemeAndPrepareNew();
                        }
                        this.currentLexeme.addAsterisk().addToValue(symbol);
                        this.maybeInsertOperator = false;
                        ignoreBlanks = true;

                    } else if (symbol === HASH) {
                        this.status = STATUS.PH_COMMENT;

                    } else { // all other symbols
                        if (lexemeNotStarted) {
                            this.addLexemeAndPrepareNew();
                            if (this.maybeInsertOperator && (symbol === EQUALS)) {
                                lexemeNotStarted = true;
                                this.delimiter = DELIMITER.BLANK;
                            } else {
                                lexemeNotStarted = false;
                                if (DIGITS.includes(symbol)) {
                                    this.currentLexeme.addToValue(symbol).setType(LEXEME_TYPE.NUMBER);
                                    this.status = STATUS.PH_NUMBER;
                                }
                                this.delimiter = DELIMITER.NONE;
                            }
                            this.maybeInsertOperator = false;
                        }
                        this.currentLexeme.addToValue(symbol);
                        ignoreBlanks = false;
                    }

                    break;

                case STATUS.PH_STRING:
                    if (symbol === this.currentLexeme.getTerminator()) {
                        if (this.currentLexeme.isEmpty()) {
                            this.error = this.error || {
                                name : 'PH_EMPTY_STRING',
                                value: `${this.currentLexeme.getTerminator()}${this.currentLexeme.getTerminator()}`
                            };
                        }
                        this.delimiter = DELIMITER.NONE;
                        lexemeNotStarted = true;
                        this.status = STATUS.PH_REGULAR;
                    } else if (symbol === escapeSymbol) {
                        if (escaping) {
                            this.currentLexeme.addToValue(symbol);
                        }
                        escaping = !escaping;
                    } else { // all other symbols
                        if (lexemeNotStarted) {
                            this.addLexemeAndPrepareNew();
                            lexemeNotStarted = false;
                        }
                        this.currentLexeme.addToValue(symbol);
                    }
                    ignoreBlanks = false;
                    break;

                case STATUS.PH_NUMBER:
                    if (DIGITS.includes(symbol)) {
                        this.currentLexeme.addToValue(symbol);
                    } else {
                        this.delimiter = DELIMITER.NONE;
                        this.posInLayer -= 1;
                        this.status = STATUS.PH_REGULAR;
                    }
                    ignoreBlanks = false;
                    break;

                case STATUS.PH_COMMENT:
                    this.checkForPhClosing(symbol, closePhMaxPosition);
                    break;
            }

            this.posInLayer += 1;
        }

        if (this.status === STATUS.TEXT) {
            this.prepareTextLexeme();
            this.insertLexeme();
        } else {
            this.error = this.error || ({ name: 'PH_UNTERMINATED_PLACEHOLDER' });
        }

        if (this.error) {
            this.error.placeholders = [ this.phBoundaries ];
            this.processor.addError(this.error);
        }
    }

    checkToUnclosedBracketsError() {
        if (this.levels.length > 1) {
            this.levels.shift();
            this.error = this.error || {
                name   : 'PH_UNCLOSED_BRACKETS',
                symbols:  this.levels.map(function(v) {return `"${v.delimiter}..."`}).join(', ')
            };
        }
    }

    checkForPhClosing(symbol, closePhMaxPosition) {
        const { options: { placeholder } } = this.renderData;
        let bufferLength = this.buffer.length;
        let closingStatus = CLOSING_STATUS.CONTINUE;

        // First: the checking for placeholder closing
        if (
            (this.lastCheckedPos < this.posInLayer)
            && (symbol === placeholder.close[bufferLength])
        ) {
            if (0 === bufferLength) {
                this.lastCheckedPos = this.posInLayer;
            }
            if (bufferLength === closePhMaxPosition) { // the placeholder ended
                this.phBoundaries.setPhEnd(this.posInLayer - closePhMaxPosition);
                this.buffer = this.result = '';
                this.delimiter = DELIMITER.TEXT_STARTED;
                this.addLexemeAndPrepareNew();
                this.checkToUnclosedBracketsError();
                this.status = STATUS.TEXT;
                closingStatus = CLOSING_STATUS.PH_CLOSED;
            } else {
                this.buffer += symbol;
                closingStatus = CLOSING_STATUS.MAYBE_CLOSING;
            }
        } else {
            this.buffer = '';
            if (bufferLength > 0) {
                this.posInLayer = this.lastCheckedPos - 1;
                closingStatus = CLOSING_STATUS.MAYBE_CLOSING;
            }
        }

        return closingStatus;
    }
}

module.exports = Parser;
