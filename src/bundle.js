const { readFileSync, writeFileSync } = require('fs')
const { resolve, isAbsolute, dirname } = require('path')
const MagicString = require('magic-string')
const Module = require('./module')
const { hasOwn, replaceIdentifiers } = require('./utils')

class Bundle {
  constructor(options) {
    this.entryPath = resolve(options.entry.replace(/\.js$/, '') + '.js')
    this.modules = {}
    this.statements = []
  }
  build(filename) {
    const entryModule = this.fetchModule(this.entryPath)
    this.statements = entryModule.expandAllStatements()
    this.definesConflict()
    const { code } = this.generate()
    writeFileSync(filename, code)
  }
  definesConflict() {
    const defines = {}
    const conflicts = {}
    this.statements.forEach(statement => {
      Object.keys(statement._defines).forEach(name => {
        if (hasOwn(defines, name)) {
          conflicts[name] = true
        } else {
          defines[name] = []
        }
        defines[name].push(statement._module)
      })
    })
    Object.keys(conflicts).forEach(name => {
      const modules = defines[name]
      modules.pop() // 最后一个重名的不处理
      modules.forEach(module => {
        const replacement = getSafeName(name)
        module.rename(name,replacement)
      })
    })
    function getSafeName(name) {
      while (hasOwn(conflicts, name)) {
        name = `_${name}`
      }
      conflicts[name] = true
      return name
    }
  }
  fetchModule(importee, importer) {
    let route
    if (!importer) {
      route = importee
    } else {
      if (isAbsolute(importee)) {
        route = importee
      } else if (importee[0] === '.') {
        route = resolve(dirname(importer), importee.replace(/\.js$/, '') + '.js')
      }
    }
    if (route) {
      const code = readFileSync(route, 'utf-8')
      const module = new Module({
        code,
        path: importee,
        bundle: this,
      })
      return module
    }
  }
  generate() {
    const ms = new MagicString.Bundle()
    this.statements.forEach(statement => {
      let replacements = {}
      Object.keys(statement._dependsOn)
        .concat(Object.keys(statement._defines))
        .forEach(name => {
          const canonicalName = statement._module.getCanonicalName(name)
          if (name !== canonicalName) {
            replacements[name] = canonicalName
          }
        })
      const source = statement._source.clone()
      if (/^Export/.test(statement.type)) {
        if (statement.type === 'ExportNamedDeclaration') {
          source.remove(statement.start, statement.declaration.start)
        }
      }
      replaceIdentifiers(statement, source, replacements)
      ms.addSource({
        content: source,
        separator: '\n',
      })
    })
    return {
      code: ms.toString()
    }
  }
}

module.exports = Bundle
