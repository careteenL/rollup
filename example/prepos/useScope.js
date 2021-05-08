const Scope = require('./scope')

var a = 1
function one() {
  var b = 2
  function two() {
    var c = 3
    console.log(a, b, c)
  }
  two()
}
one()

// 构建scope chain
const globalScope = new Scope({
  name: 'global',
  parent: null,
})
const oneScope = new Scope({
  name: 'one',
  parent: globalScope,
})
const twoScope = new Scope({
  name: 'two',
  parent: oneScope,
})

globalScope.add('a')
oneScope.add('b')
twoScope.add('c')

console.log(twoScope.findDefiningScope('a'))
console.log(oneScope.findDefiningScope('c'))
console.log(globalScope.findDefiningScope('d'))
