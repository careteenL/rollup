const { parse } = require('acorn')
const MagicString = require('magic-string')
const analyse = require('./ast/analyse')
const { hasOwn } = require('./utils')

const SYSTEM_VARIABLE = ['console', 'log']
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
    this.modifications = {} // 修改的变量
    this.canonicalNames = {} // 不重名的变量
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
      Object.keys(statement._modifies).forEach(name => {
        if (!hasOwn(this.modifications, name)) {
          this.modifications[name] = []
        }
        // 可能有多处修改
        this.modifications[name].push(statement)
      })
    })
    console.log(this.definitions, '-------------------')
  }
  expandAllStatements() {
    const allStatements = []
    this.ast.body.forEach(statement => {
      // 过滤`import`语句
      if (statement.type === 'ImportDeclaration') {
        return
      }
      // 过滤定义但未使用的变量
      if (statement.type === 'VariableDeclaration') {
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
    // 当前模块下所定义的变量 若有修改 则加入result
    // TODO: 还需解决`var a = 1; var obj = { c: 3 }; a += obj.c;`时`var obj`没被收集的问题
    const defines = Object.keys(statement._defines)
    defines.forEach(name => {
      const modifications = hasOwn(this.modifications, name) && this.modifications[name]
      if (modifications) {
        modifications.forEach(modif => {
          if (!modif._included) {
            const statements = this.expandStatement(modif)
            result.push(...statements)
          }
        })
      }
    })
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
      if (statement) {
        if (statement._included) {
          return []
        } else {
          return this.expandStatement(statement)
        }
      } else if (SYSTEM_VARIABLE.includes(name)) {
        return []
      } else {
        throw new Error(`variable '${name}' is not exist`)
      }
    }
  }
  rename(name, replacement) {
    this.canonicalNames[name] = replacement
  }
  getCanonicalName(localName) {
    if (!hasOwn(this.canonicalNames, localName)) {
      this.canonicalNames[localName] = localName
    }
    return this.canonicalNames[localName]
  }
}

module.exports = Module
