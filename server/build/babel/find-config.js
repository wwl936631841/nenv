const { join } = require('path')
const buildConfigChain = require('babel-core/lib/transformation/file/options/build-config-chain')

module.exports = function findBabelConfig (dir) {
  const filename = join(dir, 'filename.js')
  const options = { babelr: true, filename }

  const configList = buildConfigChain(options).filter(i => i.loc !== 'base')

  return configList[0]
}
