// DFS
function walk (node, { enter, leave }) {
  visit(node, null, enter, leave)
}

function visit (node, parent, enter, leave) {
  if (enter) {
    enter.call(null, node, parent)
  }
  const keys = Object.keys(node).filter(key => typeof node[key] === 'object')
  keys.forEach(key => {
    const value = node[key]
    if (Array.isArray(value)) {
      value.forEach(val => {
        visit(val, node, enter, leave)
      })
    } else if (value && value.type) {
      visit(value, node, enter, leave)
    }
  })
  if (leave) {
    leave.call(null, node, parent)
  }
}

module.exports = walk
