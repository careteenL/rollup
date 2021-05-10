const path = require('path')
const rollup = require('../../src/rollup')

const entry = path.resolve(__dirname, 'src/index.js')
rollup(entry, 'dest/bundle.js')
