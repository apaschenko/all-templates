{
	function joinAggregated(input) {
    	return input.reduce(function(acc, item){
        	acc.push(item[1]);
            return acc;
        }, []).join('');
    }

    const keywords = ['if', 'unless', 'else', 'end', '=', 'each', 'of', 'with'];
}


Start = Layer

Layer = __ nodes:Element* { return nodes }

Element  = RawText / Tag

Open = open: "{{"
Close = close: "}}"

RawText = txt:(!Open .)+ { return {type: 'text', value: joinAggregated(txt)} }


Arg = WithoutParsing
	/ AcuteStringLiteral
	/ first:ArgPart tail:(__ "." __ tail:ArgPart {return tail;})* {
    const arr=[first];
    if (tail) {
      for (let i of tail) {
          arr.push(i)
      };
    }
    return arr;
}

ArgPart = FunctionDescriptor / ItemDescriptor / StringLiteral / Relative / Pointer /Lexeme

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

Tag =
	  TagIf
    / TagUnless
    / TagInsert
    / TagEach
    / TagComment

TagIf =
	Open __ op_type:"IF"i _ value:Expression __ Comment? Close
    truePath:Layer? (Open __ "ELSE"i __ Comment? Close)?
    falsePath: (layer:Layer? Open __ "END"i __ Comment? Close {return layer})
		{return {type: 'if', value, truePath, falsePath}}

TagUnless =
	Open __ op_type:"UNLESS"i _ value:Arg __ Comment? Close
    falsePath: (Layer Open __ "ELSE"i __ Comment? Close)?
    truePath: (Layer? Open __ "END"i __ Comment? Close)
    	{return {type: 'unless', value, truePath, falsePath}}

TagInsert =
	Open __ value:Arg &{
    	const arg = Array.isArray(value) ? value[0] : {};
        return !keywords.includes(arg.value) || (arg.type === 'string')
    } __ Comment? Close
    	{return {type: 'insert', value}}

TagEach = Open
	__ "EACH"i _ variable:TmpVar
	_ "OF"i _ source:Arg
    delimiter:(_ "WITH"i _ arg:Arg {return arg;})?
    __
    Comment?
    Close
	value:Layer?
    empty:(Open __ "EMPTY" __ Comment? Close layer:Layer {return layer;})?
    Open __ "END"i __ Comment? Close
    	{return {type: 'each', variable, source, delimiter, value, empty}}

TagComment = Open __ Comment __ Close
	{return {type: 'comment'};}

Comment = HASH (!Close .)*

BracketsExpr = "(" __ expr:Expression __ ")" {return expr}

Expression =
	left:(BracketsExpr / Arg) __ operator:BinaryOperators __ right:(Expression / Arg)
 		{return {type: 'expression', left, right, operator}}
    / operator:PrefixUnaryOperators __ right:(Expression / Arg)
    	{return {type: 'expression', right, operator}}
    / left:(BracketsExpr/ Arg) __ operator:PostfixUnaryOperators
    	{return {type: 'expression', left, operator}}
    / BracketsExpr
    / Arg

BinaryOperators = "===" / "!==" / "==" / "!=" /  "<"
	/ "<=" / ">" / ">=" / "%" / OpAnd / OpOr / "+" / "-" / "*" / "/"

PrefixUnaryOperators = op:("++" / "--" / "+" / "-" / OpNot) {return 'prefix' + op}

PostfixUnaryOperators = op:("++" / "--") {return 'postfix' + op}

OpAnd = "&&" {return '&&'} / "AND"i {return '&&'}

OpOr = "||" {return '||'} / "OR"i {return '&&'}

OpNot = "!" {return '!'} / "NOT"i {return '!'}

TmpVar = "`" chars:TmpVarCharacter* "`" {return { type: "tmp_var_name", value: chars.join("") };}

StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "string", value: chars.join("") };
    }
  / "'" chars:SingleStringCharacter* "'" {
      return { type: "string", value: chars.join("") };
    }

AcuteStringLiteral = "`" chars:AcuteStringCharacter* "`" {
      return { type: "a_string", value: chars.join("") };
    }

DoubleStringCharacter
  = !('"' / ESCAPE_SYMBOL / LineTerminator) SourceCharacter { return text(); }
  / ESCAPE_SYMBOL sequence:(ESCAPE_SYMBOL / '"') { return sequence; }
  / LineContinuation

SingleStringCharacter
  = !("'" / ESCAPE_SYMBOL / LineTerminator) SourceCharacter { return text(); }
  / ESCAPE_SYMBOL sequence:EscapeSequence { return sequence; }
  / LineContinuation

AcuteStringCharacter
  = !("`" / ESCAPE_SYMBOL / LineTerminator) SourceCharacter { return text(); }
  / ESCAPE_SYMBOL sequence:EscapeSequence { return sequence; }
  / LineContinuation

TmpVarCharacter
  = !('`' / ESCAPE_SYMBOL / LineTerminator / RESTRICTED_IN_LEXEMES ) SourceCharacter { return text(); }
  / ESCAPE_SYMBOL sequence:(ESCAPE_SYMBOL / '"') { return sequence; }
  / LineContinuation

LineContinuation
  = ESCAPE_SYMBOL LineTerminatorSequence { return ""; }

EscapeSequence
  = CharacterEscapeSequence

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

SingleEscapeCharacter
  = "'"
  / '"'
  / ESCAPE_SYMBOL

NonEscapeCharacter
  = !(EscapeCharacter / LineTerminator) SourceCharacter { return text(); }

EscapeCharacter
  = SingleEscapeCharacter

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

EOF = !.

RESTRICTED_IN_LEXEMES = [#,.^()\[\'\"\]!*=+-><]

DecimalDigit
  = [0-9]

HexDigit
  = [0-9a-f]i

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
