const { resolve, join } = require('path')

module.exports = class WatchPagesPlugin {
  constructor (dir) {
    this.dir = resolve(dir, 'pages')
  }

  apply (compiler) {
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-assets', (assets, callback) => {
        delete assets[join('bundles', 'pages')]
        callback()
      })
    })

    compiler.plugin('emit', (compilation, callback) => {
      compilation.contextDependencies = [
        ...compilation.contextDependencies,
        this.dir
      ]
      callback()
    })
  }
}
