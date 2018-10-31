const loaderUtils = require('loader-utils')
const SourceNode = require('source-map').SourceNode
const { join, relative } = require('path')
const SourceMapConsumer = require('source-map').SourceMapConsumer

const CWD = join(__dirname, '..', '..', '..')

module.exports = function (content, sourceMap) {
  if (this.cacheable) this.cacheable()

  const resourcePath = join(this.resourcePath, '..')

  const relativePath = relative(resourcePath, CWD).replace(/\\/g, '/') + '/'

  content = content.replace('~nenv/', relativePath)

  if (sourceMap) {
    const currentRequest = loaderUtils.getCurrentRequest(this)
    const node = SourceNode.fromStringWithSourceMap(content, new SourceMapConsumer(sourceMap))
    // node.add('\n\n' + FOOTER + autoRuns.join('\n'))
    const result = node.toStringWithSourceMap({
      file: currentRequest
    })
    this.callback(null, result.code, result.map.toJSON())
    return
  }
  return content
}
