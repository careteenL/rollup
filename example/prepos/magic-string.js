const MagicString = require('magic-string')

const s = new MagicString(`export var name = 'careteen'`)
console.log(s.snip(0, 6).toString(), s.toString())
console.log(s.remove(0, 7).toString(), s.toString())

const b = new MagicString.Bundle()
b.addSource({
  content: `var name = 'careteen'`,
  separator: '\n',
})
b.addSource({
  content: `var age = 25`,
  separator: '\n',
})
console.log(b.toString())