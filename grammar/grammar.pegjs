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

Element  = RawText / Placeholder

Open = open: "{{"
Close = close: "}}"

RawText = txt:(!Open .)+ { return {type: 'text', value: joinAggregated(txt)} }


Arg = InEach
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

InEach = "!" __ arg:Arg {return {type: 'local', value: arg}}

Lexeme = lex:(! (Close / BLANK / [#,.^()\[\'\"\]!*] ) .)+
	{return {type: 'regular', value: joinAggregated(lex)}}

Placeholder =
	  OperatorIf
    / OperatorUnless
    / OperatorLongInsert
    / OperatorInsert
    / OperatorEach
    / CommentPlaceholder

OperatorIf =
	Open __ op_type:"IF"i _ value:Arg __ Comment? Close
    truePath:Layer? (Open __ "ELSE"i __ Comment? Close)?
    falsePath: (layer:Layer? Open __ "END"i __ Comment? Close {return layer})
		{return {type: 'if', value, truePath, falsePath}}

OperatorUnless =
	Open __ op_type:"UNLESS"i _ value:Arg __ Comment? Close
    falsePath: (Layer Open __ "ELSE"i __ Comment? Close)?
    truePath: (Layer? Open __ "END"i __ Comment? Close)
    	{return {type: 'unless', value, truePath, falsePath}}

OperatorLongInsert =
	Open __ "=" __ value:Arg __ Comment? Close
    	{return {type: 'insert', value}}

OperatorInsert =
	Open __ value:Arg &{
    	const arg = Array.isArray(value) ? value[0] : {};
        return !keywords.includes(arg.value) || (arg.type === 'string')
    } __ Comment? Close
    	{return {type: 'insert', value}}

OperatorEach = Open
	__ "EACH"i _ variable:Lexeme
	_ "OF"i _ object:Arg
    transform:(_ "TRANSFORM"i  _ arg:Arg {return arg;})?
    delimiter:(_ "WITH"i _ arg:Arg {return arg;})?
    __
    Comment?
    Close
	value:Layer?
    empty:(Open __ "EMPTY" __ Comment? Close layer:Layer {return layer;})?
    Open __ "END"i __ Comment? Close
    	{return {type: 'each', variable, object, transform, delimiter, value, empty}}

CommentPlaceholder = Open __ Comment __ Close
	{return {type: 'comment'};}

Comment = HASH (!Close .)*

StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "string", value: chars.join("") };
    }
  / "'" chars:SingleStringCharacter* "'" {
      return { type: "string", value: chars.join("") };
    }

AcuteStringLiteral = "`" chars:AcuteStringCharacter* "`" {
      return { type: "acute", value: chars.join("") };
    }

DoubleStringCharacter
  = !('"' / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

SingleStringCharacter
  = !("'" / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

AcuteStringCharacter
  = !("`" / "\\" / LineTerminator) SourceCharacter { return text(); }
  / "\\" sequence:EscapeSequence { return sequence; }
  / LineContinuation

LineContinuation
  = "\\" LineTerminatorSequence { return ""; }

EscapeSequence
  = CharacterEscapeSequence

CharacterEscapeSequence
  = SingleEscapeCharacter
  / NonEscapeCharacter

SingleEscapeCharacter
  = "'"
  / '"'
  / '`'
  / "\\"

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

DecimalDigit
  = [0-9]

HexDigit
  = [0-9a-f]i

__
  = BLANK*

_
  = BLANK+

HASH = "#"
DOT = "."
COMMA = ','
CARET = '^'
ASTERISK = '*'
BLANK = [\r\n \t\u000C]
