{
	function joinAggregated(input) {
    	return input.reduce(function(acc, item){
        	acc.push(item[1]);
            return acc;
        }, []).join('');
    }

    const keywords = ['if', 'unless', 'else', 'end', 'each', 'of', 'with', 'empty', 'for', 'while', 'do', 'block'];
}


Start = Layer

Layer = __ nodes:Element* { return nodes }

Element  = RawText / Tag

Open = open: "{{"
Close = close: "}}"

RawText = txt:(!Open .)+ { return {type: 'text', value: joinAggregated(txt)} }


Arg = WithoutParsing
	/ first:ArgPart tail:(__ "." __ tail:ArgPart {return tail;})* {
    const arr=[first];
    if (tail) {
      for (let i of tail) {
          arr.push(i)
      };
    }
    return arr;
}

ArgPart = FunctionDescriptor / ItemDescriptor / StringLiteral / LocalVar / Relative / Pointer / Lexeme

FunctionDescriptor =
	fname:(StringLiteral/ItemDescriptor/Lexeme) __ "("__ args: FuncListArgs? __ ")"
    	{return {type: 'function', value: fname, args: args || []}}

FuncListArgs = first:Arg tail:( __ "," __ arg:Arg {return arg;})*
	{
    	const arr = [first];
        for (let i of tail) {
        	arr.push(i)
        };
        return arr;
    }

ItemDescriptor = lex:Lexeme __ "[" __ item:Arg __ "]" {return {type: 'item', value: lex, item}}

Relative = CARET __ number:DecimalDigit+ {return {type: 'relative', value: parseInt(number.join(''), 10)}}

Pointer = ASTERISK __ "(" __ value:Arg __ ")" {return {type: 'pointer', value}}
	/ ASTERISK __ value:Arg                   {return {type: 'pointer', value}}

WithoutParsing = "=" __ arg:Arg {return {type: 'without_parsing', value: arg}}

Lexeme =
	lex:(DecimalDigit)+
    	{return {type: 'integer', value: lex.join('')}}
    / lex:(! (Close / BLANK / RESTRICTED_IN_LEXEMES ) .)+
		{return {type: 'regular', value: joinAggregated(lex)}}

Tag = TagFor
	/ TagIf
    / TagUnless
    / TagInsert
    / TagEach
    / TagWhile
    / TagDoWhile
    / TagBlock
    / TagComment

TagIf =
	Open __ op_type:"IF"i _ value:Expression __ Comment? Close
    truePath:Layer? (Open __ "ELSE"i __ Comment? Close)?
    falsePath: (layer:Layer? Open __ "END"i __ Comment? Close {return layer})
		{return {type: 'if', value, truePath, falsePath}}

TagUnless =
	Open __ op_type:"UNLESS"i _ value:Expression __ Comment? Close
    falsePath: (Layer Open __ "ELSE"i __ Comment? Close)?
    truePath: (Layer? Open __ "END"i __ Comment? Close)
    	{return {type: 'unless', value, truePath, falsePath}}

TagInsert =
	Open __ value:(Expression) &{
    	const arg = Array.isArray(value) ? value[0] : {};
        return !keywords.includes(arg.value) || (arg.type === 'string')
    } __ Comment? Close
    	{return {type: 'insert', value}}

TagFor = Open
        __ "FOR"i __ "(" __ init:MultiExpression? __ SEMICOLON
        __ cond:Expression? __ SEMICOLON
        __ after:MultiExpression? __ ")" __
        Comment?
        Close
        value:Layer?
        Open __ "END"i __ Comment? Close
            {return {type: 'for', init, cond, after, value}}
    / Open
        __ "FOR"i _ init:MultiExpression? __ SEMICOLON
        __ cond:Expression? __ SEMICOLON
        __ after:MultiExpression? __
        Comment?
        Close
        value:Layer?
        Open __ "END"i __ Comment? Close
            {return {type: 'for', init, cond, after, value}}

EachTagOpen = Open __ "EACH"i _ variable:LocalVar _ "OF"i _ source:Arg __ Comment? Close value:Layer?
	{return {variable, source, value}}

TagEachFistForm = open:EachTagOpen
    empty:(Open __ "EMPTY"i __ Comment? Close layer:Layer {return layer;})?
    delimiter:(Open __ "WITH"i __ Comment? Close layer:Layer {return layer;})?
    Open __ "END"i __ Comment? Close
    	{return {type: 'each', variable: open.variable, source: open.source, delimiter, value: open.value, empty}}

TagEachSecondForm = open:EachTagOpen
    delimiter:(Open __ "WITH"i __ Close layer:Layer {return layer;})?
    empty:(Open __ "EMPTY"i __ Comment? Close layer:Layer {return layer;})?
    Open __ "END"i __ Comment? Close
    	{return {type: 'each', variable: open.variable, source: open.source, delimiter, value: open.value, empty}}

TagEach = TagEachFistForm / TagEachSecondForm

TagWhile = Open __ "WHILE"i _ expression:MultiExpression __ Comment? Close
	layer:Layer Open __ "END"i __ Comment? Close
		{return {type: 'while', expression, layer}}

TagDoWhile = Open __ "DO"i __ Comment? Close layer:Layer
	Open __ "WHILE"i _ expression:MultiExpression __ Comment? Close
		{return {type: 'do_while', expression, layer}}

TagBlock = Open __ "BLOCK"i _ expression:MultiExpression __ Comment? Close layer:Layer
	Open __ "END"i __ Comment? Close
    	{return {type: 'block', expression, layer}}

TagComment = Open __ Comment __ Close
	{return {type: 'comment'};}

Comment = HASH (!Close .)*

BracketsExpr = "(" __ expr:Expression __ ")" {return expr}

Expression =
	left:(BracketsExpr / Arg) __ operator:BinaryOperators __ right:(Expression / Arg)
 		{return {type: 'expression', left, right, operator}}
    / left:LocalVar __ operator:BinaryLocalVarOperators __ right:(Expression / Arg)
 		{return {type: 'expression', left, right, operator}}
    / operator:PrefixUnaryShortSetOperators __ right:(Expression / Arg)
    	{return {type: 'expression', right, operator}}
    / operator:PrefixUnaryLocalVarOperators __ right:LocalVar
    	{return {type: 'expression', right, operator}}
    / left:LocalVar __ operator:PostfixUnaryLocalVarOperators
    	{return {type: 'expression', left, operator}}
    / BracketsExpr
    / Arg

MultiExpression = "(" first:Expression tail:(__ "," __ arg:Expression {return arg;})* ")"
    	{
    	const arr = [first];
        for (let i of tail) {
        	arr.push(i)
        };
        return arr;
    }
	/ first:Expression tail:(__ "," __ arg:Expression {return arg;})*
    	{
    	const arr = [first];
        for (let i of tail) {
        	arr.push(i)
        };
        return arr;
    }


BinaryOperators = "===" / "!==" / "==" / "!=" /  "<"
	/ "<=" / ">" / ">=" / "%" / OpAnd / OpOr / "+" / "-" / "*" / "/"

BinaryLocalVarOperators = "+=" / "-=" / "="

PrefixUnaryShortSetOperators = op:("+" / "-" / OpNot) {return 'prefix' + op}

PrefixUnaryLocalVarOperators = op:("++" / "--") {return 'prefix' + op}

PostfixUnaryLocalVarOperators = op:("++" / "--") {return 'postfix' + op}

OpAnd = "&&" {return '&&'} / "AND"i {return '&&'}

OpOr = "||" {return '||'} / "OR"i {return '&&'}

OpNot = "!" {return '!'} / "NOT"i {return '!'}

LocalVar = "`" chars:LocalVarCharacter* "`" {return { type: "local_var_name", value: chars.join("") };}

StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "string", value: chars.join("") };
    }
  / "'" chars:SingleStringCharacter* "'" {
      return { type: "string", value: chars.join("") };
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

RESTRICTED_IN_LEXEMES = [#,.;^()\[\'\"\]!*=+-><]

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
