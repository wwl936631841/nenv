const { ConcatSource } = require('webpack-sources')
const { IS_BUNDLED_PAGE, MATCH_ROUTE_NAME } = require('../../utils')

class PageChunkTemplatePlugin {
  apply (chunkTemplate) {
    chunkTemplate.plugin('render', function (modules, chunk) {
      if (!IS_BUNDLED_PAGE.test(chunk.name)) {
        return modules
      }

      let routeName = MATCH_ROUTE_NAME.exec(chunk.name)[1]

      if (/^win/.test(process.platform)) {
        routeName = routeName.replace(/\\/g, '/')
      }

      routeName = `/${routeName.replace(/(^|\/)index$/, '').replace('_', ':')}`

      const source = new ConcatSource()
      source.add(`
        nenv.loader(function() {
          var comp = 
        
      `)
      source.add(modules)
      source.add(`
          comp =  comp.default || comp
          comp.path = '${routeName}'
          return comp
        })
      `)

      return source
    })
  }
}

module.exports = class PagesPlugin {
  apply (compiler) {
    compiler.plugin('compilation', (compilation) => {
      compilation.chunkTemplate.apply(new PageChunkTemplatePlugin())
    })
  }
}
