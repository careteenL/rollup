const Bundle = require('./bundle')
// const fs = require('fs')

function rollup(entry, filename) {
  const bundle = new Bundle({
    entry,
  })
  bundle.build(filename)
}

module.exports = rollup
