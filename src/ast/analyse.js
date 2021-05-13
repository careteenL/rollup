const Scope = require('./scope')
const walk = require('./walk')

function analyse(ast, ms, module) {
  let scope = new Scope()
  // 创建作用域链
  ast.body.forEach(statement => {
    function addToScope(declarator, isBlockDeclaration = false) {
      const { name } = declarator.id
      scope.add(name, isBlockDeclaration)
      if (!scope.parent) { // 如果没有上层作用域，说明是模块内的定级作用域
        statement._defines[name] = true
      }
    }
    Object.defineProperties(statement, {
      _module: { // module实例
        value: module,
      },
      _source: { // 源代码
        value: ms.snip(statement.start, statement.end),
      },
      _defines: { // 当前模块定义的变量
        value: {},
      },
      _modifies: { // 修改的变量
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
          case 'FunctionExpression':
          case 'FunctionDeclaration':
            const params = node.params.map(p => p.name)
            if (node.type === 'FunctionDeclaration') {
              addToScope(node)
            } else if (node.type === 'FunctionExpression' && node.id) {
              params.push(node.id.name)
            }
            newScope = new Scope({
              parent: scope,
              params,
              block: true,
            })
            break;
          case 'BlockStatement':
            newScope = new Scope({
              parent: scope,
              block: true,
            })
            break;
          case 'VariableDeclaration':
            node.declarations.forEach(variableDeclarator => {
              if (node.kind === 'let' || node.kind === 'const') {
                addToScope(variableDeclarator, true)
              } else {
                addToScope(variableDeclarator, false)
              }
            })
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

  ast.body.forEach(statement => {
    // 收集外部依赖的变量
    function checkForReads(node) {
      if (node.type === 'Identifier') {
        const { name } = node
        const definingScope = scope.findDefiningScope(name)
        // 作用域链中找不到 则说明为外部依赖
        // if (!definingScope) {
          statement._dependsOn[name] = true
        // }
      }
    }
    // 收集变量修改的语句
    function checkForWrites(node) {
      function addNode(n) {
        while (n.type === 'MemberExpression') { // var a = 1; var obj = { c: 3 }; a += obj.c;
          n = n.object
        }
        if (n.type !== 'Identifier') {
          return
        }
        statement._modifies[n.name] = true
      }
      if (node.type === 'AssignmentExpression') {
        addNode(node.left)
      } else if (node.type === 'UpdateExpression') { // var a = 1; a++
        addNode(node.argument)
      } else if (node.type === 'CallExpression') {
        node.arguments.forEach(addNode)
      }
    }
    walk(statement, {
      enter(node) {
        if (node._scope) {
          scope = node._scope
        }
        checkForReads(node)
        checkForWrites(node)
      },
      leave(node) {
        if (node._scope) {
          scope = scope.parent
        }
      }
    })
  })
}

module.exports = analyse
