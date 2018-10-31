const loaderUtils = require('loader-utils')
const SourceNode = require('source-map').SourceNode
const SourceMapConsumer = require('source-map').SourceMapConsumer

const FOOTER = '/*** AUTO INJECTED BY NENV LOADER ***/\n'

module.exports = function (content, sourceMap) {
  if (this.cacheable) this.cacheable()
  const options = Object.assign(
    {},
    {
      autoRuns: ['console.log("nenv auto runs")']
    },
    loaderUtils.getOptions(this)
  )
  options.autoRuns = options.autoRuns.slice()
  const autoRuns = options.autoRuns

  if (sourceMap) {
    const currentRequest = loaderUtils.getCurrentRequest(this)
    const node = SourceNode.fromStringWithSourceMap(content, new SourceMapConsumer(sourceMap))
    node.add('\n\n' + FOOTER + autoRuns.join('\n'))
    const result = node.toStringWithSourceMap({
      file: currentRequest
    })
    this.callback(null, result.code, result.map.toJSON())
    return
  }
  return content + '\n\n' + FOOTER + autoRuns.join('\n')
}
