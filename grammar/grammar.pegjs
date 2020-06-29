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

    function buildPointer(partial, isLocalVar, first, tail) {
        const arr=[first];
        if (tail) {
          for (let i of tail) {
              arr.push(i)
          };
        }
        const result = { type: 'pointer', source: isLocalVar? 'local_vars' : 'data', value:arr };
        return partial ? {type: 'need_to_parse', value: result} : result;
    }
}


Start = Layer

Layer = els:Element* {return {type: 'layer', value: els || []}}

Element  = RawText / Tag

Open = "{{"
Close = "}}"

RawText = txt: $ (!Open .)+ { return {type: 'text', value: txt } }


PointerGet =
	partial: "*"?
	isLocalVar: "@"?
	first: PointerGetPart
	tail: (
	    __ "."
	    __ tail:PointerGetPart {return tail}
	    / __ "[" __ tail:Expression __ "]"
	        {return {type: 'square_brackets', value: tail}}
    )*
        {
            return buildPointer(partial, isLocalVar, first, tail);
        }

PointerGetPart = FunctionDescriptor / QuotedPointerPart / Lexeme

PointerSet =
	isLocalVar: "@"?
	first: PointerSetPart
	tail: (
	    __ "."
	    __ tail:PointerSetPart {return tail}
	    / __ "[" __ tail:Expression __ "]"
	        {return {type: 'square_brackets', value: tail}}
    )*
        {
            return buildPointer(false, isLocalVar, first, tail);
        }

PointerSetPart = QuotedPointerPart / Lexeme

FunctionDescriptor =
	fName:(QuotedPointerPart / Lexeme) __ "("__ args: FuncListArgs? __ ")"
    	{return {type: 'function', value: fName, args: args || []}}


FuncListArgs = first:Expression tail:( __ "," __ arg:Expression {return arg;})*
	{
    	const arr = [first];
        for (let i of tail) {
        	arr.push(i)
        };
        return arr;
    }


QuotedPointerPart = "`" chars:QuotedPointerPartCharacter* "`"
    { return { type: "regular", value: chars.join("") }; }


Lexeme =
    lex: $ (! (Close / BLANK / RESTRICTED_IN_LEXEMES ) .)+
        & {return !keywords.includes(lex.toLowerCase())}
		{return {type: 'regular', value: lex}}


Expression =
    ExprBracketsPr20
    / ExprBinaryGetPr15     // An order is matter!
    / ExprBinaryGetPr14     // All BinaryGets must be preceded other expression types because
    / ExprBinaryGetPr13     // Unary Getters/Setters can been a left part of Binary Getters
    / ExprBinaryGetPr11     //
    / ExprBinaryGetPr10     //
    / ExprBinaryGetPr6      //
    / ExprBinaryGetPr5      //
   	/ ExprPostfixUnarySetPr17
	/ ExprPrefixUnarySetPr16
	/ ExprPrefixUnaryGet16
	/ ExprBinarySetPr3
    / ExprBinaryGetSetPr3
    / Literal
    / PointerGet

ExprLeftPart = ExprBracketsPr20 / ExprPostfixUnarySetPr17 / ExprPrefixUnarySetPr16 / Literal / PointerGet 

ExprBracketsPr20 = LEFT_PARENTHESIS __ expr:Expression __ RIGHT_PARENTHESIS
    { return expr }

ExprPostfixUnarySetPr17 =
    left:PointerSet __ operator:OpPostfixUnarySetterPr17
    	{ return {type: 'expression', sources: ['left'], left, operator} }

ExprPrefixUnaryGet16 =
    operator:OpPrefixUnaryGetterPr16 __ right:Expression
        { return {type: 'expression', sources: ['right'], right, operator} }

ExprPrefixUnarySetPr16 =
    operator:OpPrefixUnarySetterPr16 __ right:PointerSet
    	{ return {type: 'expression', sources: ['right'], right, operator} }

ExprBinaryGetPr15 =
    left:ExprLeftPart
    __ operator:OpBinaryGetterPr15 __
    right:Expression
        { return {type: 'expression', sources: ['left', 'right'], left, right, operator} }

ExprBinaryGetPr14 =
    left:ExprLeftPart
    __ operator:OpBinaryGetterPr14 __
    right:Expression
        { return {type: 'expression', sources: ['left', 'right'], left, right, operator} }

ExprBinaryGetPr13 =
    left:ExprLeftPart
    __ operator:OpBinaryGetterPr13 __
    right:Expression
        { return {type: 'expression', sources: ['left', 'right'], left, right, operator} }

ExprBinaryGetPr11 =
    left:ExprLeftPart
    __ operator:OpBinaryGetterPr11 __
    right:Expression
        { return {type: 'expression', sources: ['left', 'right'], left, right, operator} }

ExprBinaryGetPr10 =
    left:ExprLeftPart
    __ operator:OpBinaryGetterPr10 __
    right:Expression
        { return {type: 'expression', sources: ['left', 'right'], left, right, operator} }

ExprBinaryGetPr6 =
    left:ExprLeftPart
    __ operator:OpBinaryGetterPr6 __
    right:Expression
        { return {type: 'expression', sources: ['left', 'right'], left, right, operator} }

ExprBinaryGetPr5 =
    left:ExprLeftPart
    __ operator:OpBinaryGetterPr5 __
    right:Expression
        { return {type: 'expression', sources: ['left', 'right'], left, right, operator} }

ExprBinarySetPr3 =
    left:PointerSet __ operator:OpBinarySetterPr3 __ right:Expression
 		{ return {type: 'expression', sources: ['right'], left, right, operator} }

ExprBinaryGetSetPr3 =
    operator:OpBinaryGetterSetterPr3 __ right:PointerSet
    	{ return {type: 'expression', sources: ['left', 'right'], right, operator} }


MultiExpression =
    LEFT_PARENTHESIS first:Expression tail:(__ "," __ arg:Expression {return arg;})* RIGHT_PARENTHESIS
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


OpPostfixUnarySetterPr17 = op:("++" / "--") {return 'postfix ' + op}

OpPrefixUnaryGetterPr16 = op:(("+" ! "++") / ("-" ! "--") / OpNotPr16) {return 'prefix ' + op}

OpPrefixUnarySetterPr16 = op:("++" / "--" / "~") {return 'prefix ' + op}

OpNotPr16 = "!" ! "!=" {return '!'} / _ "NOT"i _ {return '!'}

OpBinaryGetterPr15 = "**"

OpBinaryGetterPr14 = "*" ! ("**" / "*=") / "/" ! "/=" / "%"

OpBinaryGetterPr13 = "+" ! ("++" / "--") / "-" ! ("--" / "-=")

OpBinaryGetterPr11 = "<=" / ">=" / "<" / ">"

OpBinaryGetterPr10 = "===" / "!==" / "==" / "!="

OpBinaryGetterPr6 = "&&" {return '&&'} / _ "AND"i _ {return '&&'}

OpBinaryGetterPr5 = "||" {return '||'} / _ "OR"i _ {return '||'}

OpBinarySetterPr3 = "=" ! "=="

OpBinaryGetterSetterPr3 = "+=" / "-="


Literal = StringLiteral / NumberLiteral


StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "literal", value: chars.join("") };
    }
  / "'" chars:SingleStringCharacter* "'" {
      return { type: "literal", value: chars.join("") };
    }

DoubleStringCharacter
  = !('"' / ESCAPE_SYMBOL / LineTerminator) SourceCharacter { return text(); }
  / ESCAPE_SYMBOL sequence:(ESCAPE_SYMBOL / '"') { return sequence; }
  / LineContinuation

SingleStringCharacter
  = !("'" / ESCAPE_SYMBOL / LineTerminator) SourceCharacter { return text(); }
  / ESCAPE_SYMBOL sequence:(ESCAPE_SYMBOL / "'") { return sequence; }
  / LineContinuation


NumberLiteral =
    whole_part:(DecimalDigit)+
    fraction: ( DOT DecimalDigit+ )?
    exponent: ( "e"i [+-]? DecimalDigit+ )?
        {
          	return {
          	    type: 'literal',
          	    value: (fraction || exponent) ? parseFloat(text()) : parseInt(text(), 10)
            }
        }

QuotedPointerPartCharacter
  = !('`' / ESCAPE_SYMBOL / LineTerminator / RESTRICTED_IN_LEXEMES ) SourceCharacter { return text(); }
  / ESCAPE_SYMBOL sequence:(ESCAPE_SYMBOL / '`') { return sequence; }
  / LineContinuation

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
		        truePath: truePath || null,
		        falsePath: falsePath || null,
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
    	        truePath: truePath || null,
    	        falsePath: falsePath || null,
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
    Open __ KEY_EACH _ variable:PointerSet _ KEY_OF _ source:Expression __ Comment? Close
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
        { return { ...layer, txt} }

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

RESTRICTED_IN_LEXEMES = [#,.;^()\[\'\"\]!*=+\-><@~]

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

LEFT_PARENTHESIS = "("
RIGHT_PARENTHESIS = ")"
ESCAPE_SYMBOL = '\\'
HASH = "#"
DOT = "."
COMMA = ','
CARET = '^'
ASTERISK = '*'
BLANK = [\r\n \t\u000C]
SEMICOLON = ";"
