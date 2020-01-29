/**
 * Lib "all-templates"
 * Set of Constants
 *
 * by Alex Paschenko <past.first@gmail.com>
 * GPL-3.0
 */

'use strict';

const OPERATOR = {
    INSERT:  '=',
    IF    :  'if',
    UNLESS:  'unless',
    ELSE  :  'else',
    ELSIF :  'elsif',
    END   :  'end'
};

const OP_VALUES = Object.values(OPERATOR);

const LEXEME_TYPE = {
    REGULAR: 'regular',
    STRING : 'string',
    TEXT   : 'text',
    NUMBER : 'number'
};

const LEXEME_KIND = {
    REGULAR    : 'regular',
    EL_OF_ARRAY: 'el of array',
    RELATIVE   : 'relative',
};

const LEXEME_SPECIES = {
    REGULAR    : 'regular',
    FUNCTION   : 'function',
    ARG_OF_FUNC: 'arg of function'
};

const SYMBOL = {
    BLANKS           : ' \f\n\r\t\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002​\u2003\u2004​\u2005'
        + '\u2006​\u2007\u2008​\u2009\u200a​\u2028\u2029​​\u202f\u205f​\u3000',
    QUOTES           : '\'"`',
    A_QUOTE          : '`',
    OPEN_SQR_BRACKET : '[',
    CLOSE_SQR_BRACKET: ']',
    OPEN_PARENTHESIS : '(',
    CLOSE_PARENTHESIS: ')',
    DOT              : '.',
    COMMA            : ',',
    CARET            : '^',
    DIGITS           : '0123456789',
    HASH             : '#',
    EQUALS           : '='
};

const DELIMITER = {
    TEXT_STARTED     : 'text',
    BLANK            : 'blank(s)',
    NONE             : 'none',
    OPEN_SQR_BRACKET : SYMBOL.OPEN_SQR_BRACKET,
    CLOSE_SQR_BRACKET: SYMBOL.CLOSE_SQR_BRACKET,
    OPEN_PARENTHESIS : SYMBOL.OPEN_PARENTHESIS,
    CLOSE_PARENTHESIS: SYMBOL.CLOSE_PARENTHESIS,
    DOT              : SYMBOL.DOT,
    COMMA            : SYMBOL.COMMA,
    HASH             : SYMBOL.HASH
};

const NODE_TYPE = {
    TEXT  : 'text',
    INSERT: OPERATOR.INSERT,
    LONG_INSERT: 'long insert',
    IF    : OPERATOR.IF
};

const NODE_STATUS = {
    THEN : 'then',
    ELSE : 'else',
    ENDED: 'end'
};


module.exports = {
    OPERATOR,
    OP_VALUES,
    LEXEME_TYPE,
    LEXEME_KIND,
    LEXEME_SPECIES,
    SYMBOL,
    DELIMITER,
    NODE_TYPE,
    NODE_STATUS
};
