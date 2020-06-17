{
    const keywords = [
        'if', 'unless', 'else', 'end', 'each', 'of', 'with', 'empty', 'for', 'while', 'do', 'set', 'break', 'continue'
    ];

    function buildEachTag(open, value, empty, emptyLayer, delimiter, delimiterLayer, end) {
        const txt = [ open.txt ];
        if (empty) {
            txt.push(empty);
        }
        if (delimiter) {
            txt.push(delimiter);
        }
        txt.push(end);
        return {
            type: 'tag_each',
            variable: open.variable,
            source: open.source,
            value,
            empty: emptyLayer,
            delimiter: delimiterLayer,
            txt
        }
    }
}


Start = Layer

Layer = els:Element* {return {type: 'layer', value: els || []}}

Element  = RawText / Tag

Open = "{{"
Close = "}}"

RawText = txt: $ (!Open .)+ { return {type: 'text', value: txt } }


Id =
	partial: "="?
	first: IdPart
	tail: (__ "." __ tail:IdPart {return tail} / __ "[" __ tail:Expression __ "]" {return tail})*
        {
            const arr=[first];
            if (tail) {
              for (let i of tail) {
                  arr.push(i)
              };
            }
            const result = { type: 'id', value:arr };
            return partial ? {type: 'need_to_parse', value: result} : result;
        }

IdPart = FunctionDescriptor / StringLiteral / LocalVar / Pointer / Lexeme

FunctionDescriptor =
	fname:(StringLiteral / Lexeme) __ "("__ args: FuncListArgs? __ ")"
    	{return {type: 'function', value: fname, args: args || []}}

FuncListArgs = first:Id tail:( __ "," __ arg:Id {return arg;})*
	{
    	const arr = [first];
        for (let i of tail) {
        	arr.push(i)
        };
        return arr;
    }


Pointer = "@" __ "(" __ value:Id __ ")" {return {type: 'pointer', value}}
	/ "@" __ value:Id                   {return {type: 'pointer', value}}


Lexeme =
	lex:(DecimalDigit)+
    	{return {type: 'integer', value: parseInt(lex.join(''), 10)}}
    / lex: $ (! (Close / BLANK / RESTRICTED_IN_LEXEMES ) .)+
        & {return !keywords.includes(lex.toLowerCase())}
		{return {type: 'regular', value: lex}}

Tag = TagIf
    / TagUnless
    / TagInsert
    / TagFor
    / TagEach
    / TagWhile
    / TagDoWhile
    / TagSet
    / TagEmpty

TagIf =
	open: TagIfOpen
    truePath: Layer?
    falsePath: ElsePart?
    end: EndPart
		{
		    let txt = [open.txt];
		    if (falsePath) {
		        txt.push(falsePath.txt);
		    }
		    txt.push(end);
		    return {
		        type: 'tag_if',
		        value: open.value,
		        truePath: truePath || [],
		        falsePath: falsePath && falsePath.layer || [],
		        txt
            }
        }

TagIfOpen =
    Open __ KEY_IF _ value:Expression __ Comment? Close
        { return {value, txt: text()} }

TagUnless =
	open: TagUnlessOpen
    falsePath: Layer?
    truePath: ElsePart?
    end: EndPart
    	{
            let txt = [open.txt];
            if (truePath) {
                txt.push(truePath.txt);
            }
            txt.push(end);
    	    return {
    	        type: 'tag_if',
    	        value: open.value,
    	        truePath: truePath && truePath.value || [],
    	        falsePath: falsePath || [],
    	        txt
            }
        }

TagUnlessOpen =
    Open __ KEY_UNLESS _ value:Expression __ Comment? Close
        { return {value, txt: text()} }

TagInsert =
	Open __ expr:(Expression) __ Comment? Close
    	{ return {type: 'tag_insert', value: expr, txt: text()} }

TagFor =
    open: ( TagForOpenFirstForm / TagForOpenSecondForm )
    value: Layer?
    end: EndPart
        {
            return {
                type: 'tag_for', init: open.init, cond: open.cond, after: open.after, value, txt: [open.txt, end]
            }
        }

TagForOpenFirstForm =
    Open
    __ KEY_FOR __ "(" __ init:MultiExpression? __ SEMICOLON
    __ cond:Expression? __ SEMICOLON
    __ after:MultiExpression? __ ")" __
    Comment?
    Close
        { return {init, cond, after, txt: text()} }

TagForOpenSecondForm =
    Open
    __ KEY_FOR _ init:MultiExpression? __ SEMICOLON
    __ cond:Expression? __ SEMICOLON
    __ after:MultiExpression? __
    Comment?
    Close
        { return {init, cond, after, txt: text()} }


TagEachOpen =
    Open __ KEY_EACH _ variable:LocalVar _ KEY_OF _ source:Id __ Comment? Close
	    { return {variable, source, txt: text()} }

TagEachFistForm =
    open: TagEachOpen
    value:Layer?
    empty: (Open __ KEY_EMPTY __ Comment? Close { return text(); })?
    emptyLayer: Layer?
    delimiter: (Open __ KEY_WITH __ Comment? Close { return text(); })?
    delimiterLayer: Layer?
    end: EndPart
    	{
    	    return buildEachTag(open, value, empty, emptyLayer, delimiter, delimiterLayer, end);
        }

TagEachSecondForm =
    open: TagEachOpen
    value: Layer?
    delimiter: (Open __ KEY_WITH __ Close { return text(); })?
    delimiterLayer: Layer?
    empty: (Open __ KEY_EMPTY __ Comment? Close { return text(); })?
    emptyLayer: Layer?
    end: EndPart
    	{
    	    return buildEachTag(open, value, empty, emptyLayer, delimiter, delimiterLayer, end);
        }

TagEach = TagEachFistForm / TagEachSecondForm

TagWhile =
    open: (Open __ KEY_WHILE _ expr:MultiExpression __ Comment? Close { return {expr, txt: text()} })
	layer: Layer
	end: EndPart
		{ return {type: 'tag_while', expression: open.expr, layer, txt: [open.txt, end]} }

TagDoWhile =
    open: (Open __ KEY_DO __ Comment? Close { return text(); })
    layer: Layer
	whilePart: (Open __ KEY_WHILE _ expr:MultiExpression __ Comment? Close { return {expr, txt: text()} })
		{ return {type: 'tag_do_while', expression: whilePart.expr, layer, txt: [open, whilePart.txt]} }

TagSet =
    Open __ KEY_SET _ expression:MultiExpression __ Comment? Close
    	{ return {type: 'tag_set', expression, txt: text()} }

TagEmpty = Open __ Comment? __ Close
	{ return {type: 'tag_empty'}; }

Comment = HASH (!Close .)*

EndPart =
    Open __ "END"i __ Comment? Close { return text(); }

ElsePart =
    txt:(Open __ "ELSE"i __ Comment? Close { return text(); })
    layer: Layer?
        { return {layer, txt} }

BracketsExpr = "(" __ expr:Expression __ ")"
    { return expr }

Expression =
	ExprBinary
	/ ExprBinaryLocalVar
	/ ExprPrefixUnary
	/ ExprPrefixUnaryLocalVar
	/ ExprPostfixUnaryLocalVar
    / BracketsExpr
    / Id

ExprBinary =
    left:(BracketsExpr / Id) __ operator:BinaryOperators __ right:(Expression / Id)
        { return {type: 'expression', left, right, operator} }

ExprBinaryLocalVar =
    left:LocalVar __ operator:BinaryLocalVarOperators __ right:(Expression / Id)
 		{ return {type: 'expression', left, right, operator} }

ExprPrefixUnary =
    operator:PrefixUnaryShortSetOperators __ right:(Expression / Id)
        { return {type: 'expression', right, operator} }

ExprPrefixUnaryLocalVar =
    operator:PrefixUnaryLocalVarOperators __ right:LocalVar
    	{ return {type: 'expression', right, operator} }

ExprPostfixUnaryLocalVar =
    left:LocalVar __ operator:PostfixUnaryLocalVarOperators
    	{ return {type: 'expression', left, operator} }

MultiExpression = "(" first:Expression tail:(__ "," __ arg:Expression {return arg;})* ")"
    	{
    	const arr = [first];
        for (let i of tail) {
        	arr.push(i)
        };
        return {type: 'multi_expression', value:arr};
    }
	/ first:Expression tail:(__ "," __ arg:Expression {return arg;})*
    	{
    	const arr = [first];
        for (let i of tail) {
        	arr.push(i)
        };
        return  {type: 'multi_expression', value:arr};
    }

BinaryOperators = "===" / "!==" / "==" / "!=" /  "<"
	/ "<=" / ">" / ">=" / "%" / OpAnd / OpOr / "+" / "-" / "*" / "/"

BinaryLocalVarOperators = "+=" / "-=" / "="

PrefixUnaryShortSetOperators = op:("+" / "-" / OpNot) {return 'prefix' + op}

PrefixUnaryLocalVarOperators = op:("++" / "--") {return 'prefix' + op}

PostfixUnaryLocalVarOperators = op:("++" / "--") {return 'postfix' + op}

OpAnd = "&&" {return '&&'} / "AND"i {return '&&'}

OpOr = "||" {return '||'} / "OR"i {return '||'}

OpNot = "!" {return '!'} / "NOT"i {return '!'}

LocalVar = "`" chars:LocalVarCharacter* "`"
    { return { type: "local_var", value: chars.join("") }; }

StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "regular", subtype: "string", value: chars.join("") };
    }
  / "'" chars:SingleStringCharacter* "'" {
      return { type: "regular", subtype: "string", value: chars.join("") };
    }

DoubleStringCharacter
  = !('"' / ESCAPE_SYMBOL / LineTerminator) SourceCharacter { return text(); }
  / ESCAPE_SYMBOL sequence:(ESCAPE_SYMBOL / '"') { return sequence; }
  / LineContinuation

SingleStringCharacter
  = !("'" / ESCAPE_SYMBOL / LineTerminator) SourceCharacter { return text(); }
  / ESCAPE_SYMBOL sequence:(ESCAPE_SYMBOL / "'") { return sequence; }
  / LineContinuation

LocalVarCharacter
  = !('`' / ESCAPE_SYMBOL / LineTerminator / RESTRICTED_IN_LEXEMES ) SourceCharacter { return text(); }
  / ESCAPE_SYMBOL sequence:(ESCAPE_SYMBOL / '`') { return sequence; }
  / LineContinuation

LineContinuation
  = ESCAPE_SYMBOL LineTerminatorSequence { return ""; }

SourceCharacter
  = .

LineTerminator
  = [\n\r\u2028\u2029]

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

RESTRICTED_IN_LEXEMES = [#,.;^()\[\'\"\]!*=+\-><@]

KEY_IF = "IF"i

KEY_UNLESS = "UNLESS"i

KEY_ELSE = "ELSE"i

KEY_END = "END"i

KEY_EACH = "EACH"i

KEY_OF = "OF"i

KEY_WITH = "WITH"i

KEY_EMPTY = "EMPTY"i

KEY_FOR = "FOR"i

KEY_WHILE = "WHILE"i

KEY_DO = "DO"i

KEY_SET = "SET"i

DecimalDigit
  = [0-9]
__
  = BLANK*

_
  = BLANK+

ESCAPE_SYMBOL = '\\'
HASH = "#"
DOT = "."
COMMA = ','
CARET = '^'
ASTERISK = '*'
BLANK = [\r\n \t\u000C]
SEMICOLON = ";"
