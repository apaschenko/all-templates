{
    const keywords = ['if', 'unless', 'else', 'end', 'each', 'of', 'with', 'empty', 'for', 'while', 'do', 'block'];
}


Start = Layer

Layer = Element*

Element  = RawText / Tag

Open = "{{"
Close = "}}"

RawText = txt: $ (!Open .)+ { return {type: 'text', value: txt} }


Id = WithoutParsing
	/ first:IdPart tail:(__ "." __ tail:IdPart {return tail} / __ "[" __ tail:Expression __ "]" {return tail})* {
    const arr=[first];
    if (tail) {
      for (let i of tail) {
          arr.push(i)
      };
    }
    return {type: 'id', value:arr};
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


Pointer = ASTERISK __ "(" __ value:Id __ ")" {return {type: 'pointer', value}}
	/ ASTERISK __ value:Id                   {return {type: 'pointer', value}}

WithoutParsing = "=" __ arg:Id {return {type: 'without_parsing', value: arg}}

Lexeme =
	lex:(DecimalDigit)+
    	{return {type: 'integer', value: lex.join('')}}
    / lex: $ (! (Close / BLANK / RESTRICTED_IN_LEXEMES ) .)+
        & {return !keywords.includes(lex.toLowerCase())}
		{return {type: 'regular', value: lex}}

Tag = TagIf
    / TagUnless
    / TagFor
    / TagInsert
    / TagEach
    / TagWhile
    / TagDoWhile
    / TagScope
    / TagComment

TagIf =
	Open __ KEY_IF _ value:Expression __ Comment? Close
    truePath: Layer?
    falsePath: ElsePart?
    EndPart
		{  return {type: 'tag_if', value, truePath: truePath || [], falsePath: falsePath || []}}

TagUnless =
	Open __ KEY_UNLESS _ value:Expression __ Comment? Close
    falsePath: Layer?
    truePath: ElsePart?
    EndPart
    	{return {type: 'tag_if', value, truePath: truePath || [], falsePath: falsePath || []}}

TagInsert =
	Open __ expr:(Expression) __ Comment? Close
    	{return {type: 'tag_insert', value: expr}}

TagFor = Open
        __ KEY_FOR __ "(" __ init:MultiExpression? __ SEMICOLON
        __ cond:Expression? __ SEMICOLON
        __ after:MultiExpression? __ ")" __
        Comment?
        Close
        value:Layer?
        EndPart
            {return {type: 'tag_for', init, cond, after, value}}
    / Open
        __ KEY_FOR _ init:MultiExpression? __ SEMICOLON
        __ cond:Expression? __ SEMICOLON
        __ after:MultiExpression? __
        Comment?
        Close
        value:Layer?
        EndPart
            {return {type: 'tag_for', init, cond, after, value}}

EachTagOpen = Open __ KEY_EACH _ variable:LocalVar _ KEY_OF _ source:Id __ Comment? Close value:Layer?
	{return {variable, source, value}}

TagEachFistForm = open:EachTagOpen
    empty:(Open __ KEY_EMPTY __ Comment? Close layer:Layer {return layer;})?
    delimiter:(Open __ KEY_WITH __ Comment? Close layer:Layer {return layer;})?
    EndPart
    	{return {
    	    type: 'tag_each', variable: open.variable, source: open.source, delimiter, value: open.value, empty
        }}

TagEachSecondForm = open:EachTagOpen
    delimiter:(Open __ KEY_WITH __ Close layer:Layer {return layer;})?
    empty:(Open __ KEY_EMPTY __ Comment? Close layer:Layer {return layer;})?
    EndPart
    	{return {
    	    type: 'tag_each', variable: open.variable, source: open.source, delimiter, value: open.value, empty
        }}

TagEach = TagEachFistForm / TagEachSecondForm

TagWhile = Open __ KEY_WHILE _ expression:MultiExpression __ Comment? Close
	layer:Layer
	EndPart
		{return {type: 'tag_while', expression, layer}}

TagDoWhile = Open __ KEY_DO __ Comment? Close layer:Layer
	Open __ KEY_WHILE _ expression:MultiExpression __ Comment? Close
		{return {type: 'tag_do_while', expression, layer}}

TagScope = Open __ KEY_SCOPE _ expression:MultiExpression __ Comment? Close
    layer:Layer
	EndPart
    	{return {type: 'tag_scope', expression, layer}}

TagComment = Open __ Comment __ Close
	{return {type: 'tag_comment'};}

Comment = HASH (!Close .)*

EndPart =
    Open __ "END"i __ Comment? Close

ElsePart =
    Open __ "ELSE"i __ Comment? Close layer: Layer? {return layer}

BracketsExpr = "(" __ expr:Expression __ ")" {return expr}

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
        {return {type: 'expression', left, right, operator}}

ExprBinaryLocalVar =
    left:LocalVar __ operator:BinaryLocalVarOperators __ right:(Expression / Id)
 		{return {type: 'expression', left, right, operator}}

ExprPrefixUnary =
    operator:PrefixUnaryShortSetOperators __ right:(Expression / Id)
        {return {type: 'expression', right, operator}}

ExprPrefixUnaryLocalVar =
    operator:PrefixUnaryLocalVarOperators __ right:LocalVar
    	{return {type: 'expression', right, operator}}

ExprPostfixUnaryLocalVar =
    left:LocalVar __ operator:PostfixUnaryLocalVarOperators
    	{return {type: 'expression', left, operator}}

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

RESTRICTED_IN_LEXEMES = [#,.;^()\[\'\"\]!*=+-><]

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

KEY_SCOPE = "SCOPE"i

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
