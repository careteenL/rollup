function analyse(ast, ms) {
  ast.body.forEach(statement => {
    Object.defineProperties(statement, {
      _source: {
        value: ms.snip(statement.start, statement.end)
      }
    })
  })
}

module.exports = analyse
