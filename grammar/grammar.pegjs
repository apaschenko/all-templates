{
	function joinAggregated(input) {
    	return input.reduce(function(acc, item){
        	acc.push(item[1]);
            return acc;
        }, []).join('');
    }
}


Start = Layer

Layer = __ nodes:Element* { return nodes }

Element  = RawText / Placeholder

Open = open: "{{"
Close = close: "}}"

RawText = txt:(!Open .)+ {return {type: 'text', value: joinAggregated(txt)}}


Arg = AcuteStringLiteral
	/ first:ArgPart tail:(__ "." __ tail:ArgPart {return tail;})* {
    const arr=[first];
    if (tail) {
      for (let i of tail) {
          arr.push(i)
      };
    }
    return arr;
}

ArgPart = FunctionDescriptor / ItemDescriptor / StringLiteral / Relative / Pointer / Lexeme

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

Pointer = ASTERISK __ "(" __ args:Arg __ ")" {return {type: 'pointer', args}}
	/ ASTERISK __ args:Arg                   {return {type: 'pointer', args}}

Lexeme = lex:(! (Close / BLANK / [#,.^()\[\'\"\]*] ) .)+ {return {type: 'lexeme', value: joinAggregated(lex)}}

Placeholder =
	  op:OperatorIf
    / op:OperatorUnless
    / op:OperatorLongInsert
//    / op:OperatorInsert

OperatorIf =
	Open __ op_type:"IF"i _ args:Arg __ Comment? Close
    truePath:Layer? (Open __ "ELSE"i __ Comment? Close)?
    falsePath: (layer:Layer? Open __ "END"i __ Comment? Close {return layer})
		{return {op_type: 'if', args/*: joinAggregated(args)*/, truePath, falsePath}}

OperatorUnless =
	Open __ op_type:"UNLESS"i _ args:Arg __ Comment? Close
    falsePath: (Layer Open __ "ELSE"i __ Comment? Close)?
    truePath: (Layer? Open __ "END"i __ Comment? Close)
    	{return {op_type: 'unless', args/*: joinAggregated(args)*/, truePath, falsePath}}

OperatorLongInsert =
	Open __ "=" __ args:Arg __ Comment? Close
    	{return {op_type: 'insert', args}}

OperatorInsert =
	Open __ args:Arg __ Comment? Close
    	{return {op_type: 'insert', args/*: joinAggregated(args)*/}}

Comment = HASH (!Close .)*

StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "regular", value: chars.join("") };
    }
  / "'" chars:SingleStringCharacter* "'" {
      return { type: "regular", value: chars.join("") };
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
