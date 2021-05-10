const { readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')
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
  fetchModule(importee) {
    let route = importee
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
