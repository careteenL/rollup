const Scope = require('./scope')
const walk = require('./walk')

function analyse(ast, ms) {
  let scope = new Scope()
  // 创建作用域链、
  ast.body.forEach(statement => {
    function addToScope(declarator) {
      const { name } = declarator.id
      scope.add(name)
      if (!scope.parent) { // 如果没有上层作用域，说明是模块内的定级作用域
        statement._defines[name] = true
      }
    }
    Object.defineProperties(statement, {
      _source: { // 源代码
        value: ms.snip(statement.start, statement.end),
      },
      _defines: { // 当前模块定义的变量
        value: {},
      },
      _dependsOn: { // 当前模块没有定义的变量，即外部依赖的变量
        value: {},
      },
      _included: { // 是否已经包含在输出语句中
        value: false,
        writable: true,
      },
    })
    // 收集每个语句上定义的变量，创建作用域链
    walk(statement, {
      enter(node) {
        let newScope
        switch (node.type) {
          case 'FunctionDeclaration':
            const params = node.params.map(p => p.name)
            addToScope(node)
            newScope = new Scope({
              parent: scope,
              params,
            })
            break;
          case 'VariableDeclaration':
            node.declarations.forEach(addToScope)
            break;
        }
        if (newScope) {
          Object.defineProperty(node, '_scope', {
            value: newScope,
          })
          scope = newScope
        }
      },
      leave(node) {
        if (node._scope) {
          scope = scope.parent
        }
      },
    })
  })
  ast._scope = scope
  // 收集外部依赖的变量
  ast.body.forEach(statement => {
    walk(statement, {
      enter(node) {
        if (node.type === 'Identifier') {
          const { name } = node
          const definingScope = scope.findDefiningScope(name)
          // 作用域链中找不到 则说明为外部依赖
          if (!definingScope) {
            statement._dependsOn[name] = true
          }
        }
      },
    })
  })
}

module.exports = analyse
