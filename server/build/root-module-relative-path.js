const { sep } = require('path')
const RELATIVE_START = `node_modules${sep}`

module.exports = (moduleRequire) => (path) => {
  const absolutePath = moduleRequire.resolve(path)
        .replace(/[\\/]package\.json$/, '')

  const relativeStartIndex = absolutePath.indexOf(RELATIVE_START)

  if (relativeStartIndex === -1) {
    return absolutePath
  }

  return absolutePath.substring(relativeStartIndex + RELATIVE_START.length)
}
