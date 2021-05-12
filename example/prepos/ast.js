
const walk = require('./walk')
// Test
const acorn = require('acorn')

const ast = acorn.parse(
  `import $ from 'jquery';
  var obj = { c: 3 }
  var a = 1;
  a += obj.c;
  a++
  `,
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
VariableDeclaration
  VariableDeclarator
    Identifier
    Identifier
    ObjectExpression
      Property
        Identifier
        Identifier
        Literal
        Literal
      Property
    ObjectExpression
  VariableDeclarator
VariableDeclaration
VariableDeclaration
  VariableDeclarator
    Identifier
    Identifier
    Literal
    Literal
  VariableDeclarator
VariableDeclaration
ExpressionStatement
  AssignmentExpression
    Identifier
    Identifier
    MemberExpression
      Identifier
      Identifier
      Identifier
      Identifier
    MemberExpression
  AssignmentExpression
ExpressionStatement
ExpressionStatement
  UpdateExpression
    Identifier
    Identifier
  UpdateExpression
ExpressionStatement
 */
