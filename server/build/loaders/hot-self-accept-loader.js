const { resolve, relative } = require('path')

module.exports = function (content, sourceMap) {
  this.cacheable()

  const route = getRoute(this)
  this.callback(null, `${content}
  ;(function (Component, route) {
    // if(!module.hot) return
    // if (!__resourceQuery) return

    // var qs = require('querystring')
    // var params = qs.parse(__resourceQuery.slice(1))
    // if (params.entry == null) return

    module.hot.accept()

    //if (module.hot.status() === 'idle') return

    //console.log(route)
  })(typeof __webpack_exports__ !== 'undefined' ? __webpack_exports__.default : (module.exports.default || module.exports), ${JSON.stringify(route)})
  `
  , sourceMap)
}

// const nextPagesDir = resolve(__dir, '..', '')

function getRoute (loaderContext) {
  const pagesDir = resolve(loaderContext.options.context, 'pages')
  const { resourcePath } = loaderContext
  const dir = [pagesDir]
  .find((d) => resourcePath.indexOf(d) === 0)
  const path = relative(dir, resourcePath)
  return '/' + path.replace(/((^|\/)index)?\.(js | vue)$/, '')
}
