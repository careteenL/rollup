const path = require('path')

class Bundle {
  constructor(options) {
    this.entryPath = path.resolve(options.entry.replace(/\.js$/, '') + '.js')
    this.modules = {}
  }
  build(filename) {
    console.log(this.entryPath, filename)
  }
}

module.exports = Bundle
