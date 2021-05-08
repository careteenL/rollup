
const walk = require('./walk')
// Test
const acorn = require('acorn')

const ast = acorn.parse(
  `import $ from 'jquery';`,
  {
    locations: true,
    ranges: true,
    sourceType: 'module',
    ecmaVersion: 8,
  }
)

let ident = 0
const padding = () => ' '.repeat(ident)

ast.body.forEach(statement => {
  walk(statement, {
    enter(node) {
      if (node.type) {
        console.log(padding() + node.type)
        ident += 2
      }
    },
    leave(node) {
      if (node.type) {
        ident -= 2
        console.log(padding() + node.type)
      }
    }
  })
})

/**
ImportDeclaration
  ImportDefaultSpecifier
    Identifier
    Identifier
  ImportDefaultSpecifier
  Literal
  Literal
ImportDeclaration
 */
