const { join, relative, sep } = require('path')
const WebpackDevMiddleware = require('webpack-dev-middleware')
const WebpackHotMiddleware = require('webpack-hot-middleware')
const webpack = require('./build/webpack')
const getConfig = require('./config')
const UUID = require('uuid')
const { IS_BUNDLED_PAGE } = require('./utils')

module.exports = class HotReloader {
  constructor (dir, { quiet, conf } = {}) {
    this.dir = dir
    this.quiet = quiet
    this.middlewares = []
    this.webpackDevMiddleware = null
    this.webpackHotMiddleware = null
    this.initialized = false
    this.stats = null
    this.compilationErrors = null
    this.prevAssets = null
    this.prevChunkNames = null
    this.prevFailedChunkNames = null
    this.prevChunkHashes = null

    this.buildId = UUID.v4()

    this.config = getConfig(dir, conf)
  }

  async run (req, res, next) {
    for (const fn of this.middlewares) {
      await new Promise((resolve, reject) => {
        fn(req, res, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    }
  }

  async start () {
    const [compiler] = await Promise.all([
      webpack(this.dir, { buildId: this.buildId, dev: true, quiet: this.quiet })
    ])

    const buildTools = await this.prepareBuildTools(compiler)
    this.assignBuildTools(buildTools)

    this.stats = await this.waitUntilVaild()
  }

  async stop (webpackDevMiddleware) {
    const middleware = webpackDevMiddleware || this.webpackDevMiddleware
    if (middleware) {
      return new Promise((resolve, reject) => {
        middleware.close((err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    }
  }

  async reload () {
    this.stats = null

    const [compiler] = await Promise.all([
      webpack(this.dir, { buildId: this.buildId, dev: true, quiet: this.quiet })
    ])

    const buildTools = await this.prepareBuildTools(compiler)
    this.stats = await this.waitUntilVaild(buildTools.webpackDevMiddleware)

    const oldWebpackDevMiddleware = this.webpackDevMiddleware
    this.assignBuildTools(buildTools)
    await this.stop(oldWebpackDevMiddleware)
  }

  assignBuildTools ({ webpackDevMiddleware, webpackHotMiddleware }) {
    this.webpackDevMiddleware = webpackDevMiddleware
    this.webpackHotMiddleware = webpackHotMiddleware
    this.middlewares = [
      webpackDevMiddleware,
      webpackHotMiddleware
    ]
  }

  async prepareBuildTools (compiler) {
    compiler.plugin('after-emit', (compilation, callback) => {
      const { assets } = compilation

      if (this.prevAssets) {
        for (const f of Object.keys(assets)) {
          deleteCache(assets[f].existsAt)
        }

        for (const f of Object.keys(this.prevAssets)) {
          if (!assets[f]) {
            deleteCache(this.prevAssets[f].existsAt)
          }
        }
      }
      this.prevAssets = assets

      callback()
    })

    compiler.plugin('done', (stats) => {
      const { compilation } = stats
      const chunkNames = new Set(
          compilation.chunks
              .map((c) => c.name)
              .filter(name => IS_BUNDLED_PAGE.test(name))
        )

      const failedChunkNames = new Set(compilation.errors
        .map((e) => e.module.reasons)
        .reduce((a, b) => a.concat(b), [])
        .map((r) => r.module.chunks)
        .reduce((a, b) => a.concat(b), [])
        .map((c) => c.name))

      const chunkHashes = new Map(
        compilation.chunks
          .filter(c => IS_BUNDLED_PAGE.test(c.name))
          .map((c) => [c.name, c.hash])
      )

      if (this.initialized) {
        const added = diff(chunkNames, this.prevChunkNames)
        const removed = diff(this.prevChunkNames, chunkNames)
        const succeeded = diff(this.prevFailedChunkNames, failedChunkNames)

        const failed = failedChunkNames

        const rootDir = join('bundles', 'pages')

        for (const n of new Set([...added, ...removed, ...failed, ...succeeded])) {
          const route = toRoute(relative(rootDir, n))
          this.send('reload', route)
        }

        for (const [n, hash] of chunkHashes) {
          if (!this.prevChunkHashes.has(n)) continue
          if (this.prevChunkHashes.get(n) === hash) continue

          const route = toRoute(relative(rootDir, n))

          this.send('change', route)
        }
      }

      this.initialized = true
      this.stats = stats
      this.compilationErrors = null
      this.prevChunkNames = chunkNames
      this.prevFailedChunkNames = failedChunkNames
      this.prevChunkHashes = chunkHashes
    })

    const ignored = [
      /(^|[/\\])\../ // .dotfiles
     // /node_modules/
    ]

    let webpackDevMiddlewareConfig = {
      publicPath: ``,
      // noInfo: true,
      // quiet: true,
      clientLogLevel: 'warning',
      watchOptions: { ignored }
    }

    if (this.config.webpackDevMiddleware) {
      console.log(`> Using "webpackDevMiddleware" config defined in ${this.config.configOrigin}.`)
      webpackDevMiddlewareConfig = this.config.webpackDevMiddleware(webpackDevMiddlewareConfig)
    }

    const webpackDevMiddleware = WebpackDevMiddleware(compiler, webpackDevMiddlewareConfig)

    const webpackHotMiddleware = WebpackHotMiddleware(compiler, {
      path: '/_nenv/webpack-hmr',
      // log: false,
      heartbeat: 2500
    })

    return {
      webpackDevMiddleware,
      webpackHotMiddleware
    }
  }

  waitUntilVaild (webpackDevMiddleware) {
    const middleware = webpackDevMiddleware || this.webpackDevMiddleware
    return new Promise((resolve) => {
      middleware.waitUntilValid(resolve)
    })
  }

  send (action, ...args) {
    this.webpackHotMiddleware.publish({ action, data: args })
  }
}

function deleteCache (path) {
  delete require.cache[path]
}

function diff (a, b) {
  return new Set([...a].filter((v) => !b.has(v)))
}

function toRoute (file) {
  const f = sep === '\\' ? file.replace(/\\g/, '/') : file
  return ('/' + f).replace(/(\/index)?\.js$/, '') || '/'
}
