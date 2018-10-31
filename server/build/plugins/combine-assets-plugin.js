const { ConcatSource } = require('webpack-sources')

module.exports = class CombineAssetsPlugin {
  constructor ({ input, output }) {
    this.input = input
    this.output = output
  }

  apply (compiler) {
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('additional-chunk-assets', (chunks) => {
        const concat = new ConcatSource()

        this.input.forEach((name) => {
          const assets = compilation.assets[name]
          if (!assets) return

          concat.add(assets)
        })

        compilation.additionalChunkAssets.push(this.output)
        compilation.assets[this.output] = concat

        chunks.filter((chunks) => {
          return chunks.files.reduce((prev, file) => prev || this.input.includes(file), false)
        }).forEach((chunk) => chunk.files.push(this.output))
      })
    })
  }
}
