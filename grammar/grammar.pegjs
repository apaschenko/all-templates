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

Element  = RawText / Operator

Open = open: "{{"
Close = close: "}}"

RawText = txt:(!Open .)+ {return {type: 'text', value: joinAggregated(txt)}}


//Arg = (!Close .)+
Arg = AcuteStringLiteral
	/ ArgPart (__ "." __ ArgPart)*

ArgPart = FunctionDescriptor / Item / Lexeme

FunctionDescriptor = Lexeme __ "("__ ListArgs __ ")"

Operator =
	  op:OperatorIf
    / op:OperatorUnless
    / op:OperatorLongInsert
    / op:OperatorInsert

OperatorIf =
	Open __ op_type:"IF"i _ arg:Arg __ Comment? Close nested:Layer Open __ "END"i __ Comment? Close
		{return {op_type: 'if', arg: joinAggregated(arg), nested}}

OperatorUnless =
	Open __ op_type:"UNLESS"i _ arg:Arg __ Comment? Close nested:Layer Open __ "END"i __ Comment? Close
    	{return {op_type: 'unless', arg: joinAggregated(arg), nested}}

OperatorLongInsert =
	Open __ op_type:"=" _ arg:Arg __ Comment? Close
    	{return {op_type: 'insert', arg: joinAggregated(arg)}}

OperatorInsert =
	Open __ op_type:"a" __ arg:Arg __ Comment? Close
    	{return {op_type: 'insert', arg: joinAggregated(arg)}}

Comment = HASH (!Close .)*

StringLiteral "string"
  = '"' chars:DoubleStringCharacter* '"' {
      return { type: "regular", value: chars.join("") };
    }
  / "'" chars:SingleStringCharacter* "'" {
      return { type: "regular", value: chars.join("") };
    }

AcuteStringLiteral = "`" chars:AcuteStringCharacter* "`" {
      return { type: "regular", value: chars.join("") };
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

//HexEscapeSequence
//  = "x" digits:$(HexDigit HexDigit) {
//      return String.fromCharCode(parseInt(digits, 16));
//    }

//UnicodeEscapeSequence
//  = "u" digits:$(HexDigit HexDigit HexDigit HexDigit) {
//      return String.fromCharCode(parseInt(digits, 16));
//    }

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
  = [\r\n \t\u000C]*

_
  = [\r\n \t\u000C]+

HASH = "#"
DOT = "."
