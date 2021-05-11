const { parse } = require('acorn')
const MagicString = require('magic-string')
const analyse = require('./ast/analyse')

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

class Module {
  constructor({
    code,
    path,
    bundle,
  }) {
    this.code = new MagicString(code, {
      filename: path,
    })
    this.path = path
    this.bundle = bundle
    this.ast = parse(code, {
      ecmaVersion: 7,
      sourceType: 'module',
    })
    this.imports = {} // 导入的变量
    this.exports = {} // 导出的变量
    this.definitions = {} // 变量定义的语句
    this.analyse()
  }
  analyse() {
    // 收集导入和导出变量
    this.ast.body.forEach(node => {
      if (node.type === 'ImportDeclaration') {
        const source = node.source.value
        node.specifiers.forEach(specifier => {
          const { name: localName} = specifier.local
          const { name } = specifier.imported
          this.imports[localName] = {
            source,
            name,
            localName,
          }
        })
      } else if (node.type === 'ExportNamedDeclaration') {
        const { declaration } = node
        if (declaration.type === 'VariableDeclaration') {
          const { name } = declaration.declarations[0].id
          this.exports[name] = {
            node,
            localName: name,
            expression: declaration,
          }
        }
      }
    })
    analyse(this.ast, this.code, this)
    // 收集所有语句定义的变量，建立变量和声明语句之间的对应关系
    this.ast.body.forEach(statement => {
      Object.keys(statement._defines).forEach(name => {
        this.definitions[name] = statement
      })
    })
  }
  expandAllStatements() {
    const allStatements = []
    this.ast.body.forEach(statement => {
      // 过滤`import`语句
      if (statement.type === 'ImportDeclaration') {
        return
      }
      const statements = this.expandStatement(statement)
      allStatements.push(...statements)
    })
    return allStatements
  }
  expandStatement(statement) {
    statement._included = true
    const result = []
    const dependencies = Object.keys(statement._dependsOn)
    dependencies.forEach(name => {
      const definition = this.define(name)
      result.push(...definition)
    })
    result.push(statement)
    return result
  }
  define(name) {
    if (hasOwn(this.imports, name)) {
      const importDeclaration = this.imports[name]
      const mod = this.bundle.fetchModule(importDeclaration.source, this.path)
      const exportDeclaration = mod.exports[importDeclaration.name]
      if (!exportDeclaration) {
        throw new Error(`Module ${mod.path} does not export ${importDeclaration.name} (imported by ${this.path})`)
      }
      return mod.define(exportDeclaration.localName)
    } else {
      let statement = this.definitions[name]
      if (statement && !statement._included) {
        return this.expandStatement(statement)
      } else {
        return []
      }
    }
  }
}

module.exports = Module
