

SourceCharacter
  = .

WhiteSpace "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
  / "\u00A0"
  / "\uFEFF"

Start = Placeholders

Placeholders =
left:Text? Placeholder right:Text? {console.log({left, Placeholder, right})}

Text = ! '{{'

Placeholder = '{{' SourceCharacter* '}}'
