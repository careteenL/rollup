const { readFileSync, writeFileSync } = require('fs')
const { resolve, isAbsolute, dirname } = require('path')
const Module = require('./module')
const MagicString = require('magic-string')

class Bundle {
  constructor(options) {
    this.entryPath = resolve(options.entry.replace(/\.js$/, '') + '.js')
    this.modules = {}
    this.statements = []
  }
  build(filename) {
    const entryModule = this.fetchModule(this.entryPath)
    this.statements = entryModule.expandAllStatements()
    const { code } = this.generate()
    writeFileSync(filename, code)
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
      const source = statement._source.clone()
      if (/^Export/.test(statement.type)) {
        if (statement.type === 'ExportNamedDeclaration') {
          source.remove(statement.start, statement.declaration.start)
        }
      }
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
