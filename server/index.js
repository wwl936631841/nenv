const path = require('path')
const { resolve, join, sep } = path
const fs = require('fs')
const express = require('express')
const mockjs = require('mockjs')
const http = require('http')
const proxyMiddleware = require('http-proxy-middleware')
const historyApiFallbackMiddleware = require('connect-history-api-fallback')
const getConfig = require('./config')
const { STATUS_CODES } = http

module.exports = class Server {
  constructor ({ dir = '.', dev = false, staticMarkup = false, quiet = false, conf = null } = {}) {
    if (dev) {
      require('source-map-support').install({
        hookRequire: true
      })
    }

    this.dir = resolve(dir)
    this.dev = dev
    this.hotReloader = this.getHotReloader(this.dir, { quiet, conf })
    this.config = getConfig(this.dir, conf)
    this.mocker = this.getMock(this.dir, { quiet, conf })
    this.proxies = this.getProxies(this.dir, { quiet, conf })
    this.http = null
    this.dist = this.config.distDir
    this.app = express()
  }

  getHotReloader (dir, options) {
    const HotReloader = require('./hot-reloader')
    return new HotReloader(dir, options)
  }

  handleRequest (req, res, next) {
    return this.run(req, res, next)
      .catch((err) => {
        if (!this.quiet) console.error(err)
        res.statusCode = 500
        res.send(STATUS_CODES[500])
      })
  }

  getRequestHandler () {
    return this.handleRequest.bind(this)
  }

  getProxies (dir, { quiet, conf } = { }) {
    const fns = [(req, res, next) => next()]
    try {
      const proxyTable = this.config.proxy || {}
      Object.keys(proxyTable).forEach((context) => {
        let options = proxyTable[context]
        if (typeof options === 'string') {
          options = { target: options }
        }
        fns.push(proxyMiddleware(options.filter || context, options))
      })
      return fns
    } catch (e) {
      console.log(e)
      return fns
    }
  }

  getMock (dir, { quiet, conf } = {}) {
    const serverFile = join(dir, 'server.js')

    function requireServer (filename) {
      let middleware = null
      delete require.cache[filename]
      try {
        const router = express.Router()
        middleware = require(filename)(router, mockjs)
      } catch (err) {
        console.log(err)
        middleware = null
      }
      return middleware
    }

    let middleware = requireServer(serverFile)

    fs.watch(serverFile, function () {
      middleware = requireServer(serverFile)
    })

    return function (req, res, next) {
      if (middleware) {
        try {
          // 如果是以.结尾的则直接通过
          if (/\.[^.]*$/.test(req.path)) {
            next()
          } else {
            res.reply = function (data, { code = 0, msg = '成功' } = {}) {
              res.send({
                data: data,
                code: code,
                msg: msg
              })
            }
            middleware(req, res, function (err) {
              if (err) {
                console.log(err)
              } else {
                next()
              }
            })
          }
        } catch (err) {
          next(err)
        }
      } else {
        next()
      }
    }
  }

  async prepare () {
    if (this.hotReloader) {
      await this.hotReloader.start()
    }
  }

  async close () {
    if (this.hotReloader) {
      await this.hotReloader.stop()
    }

    if (this.http) {
      await new Promise((resolve, reject) => {
        this.http.close((err) => {
          if (err) return reject(err)
          return resolve()
        })
      })
    }
  }

  defineRoutes () {
    const routes = {

    }
    return routes
  }

  async start (port, hostname) {
    await this.prepare()

    this.app.use(this.mocker)

    this.proxies.map((proxy) => {
      this.app.use(proxy)
    })
    // this.app.use(this.proxy)

    this.app.use(historyApiFallbackMiddleware())

    this.app.use(this.getRequestHandler())

    this.app.use('/static', express.static(join(this.dir, './static')))

    this.http = http.createServer(this.app)

    await new Promise((resolve, reject) => {
      this.http.on('error', reject)
      this.http.on('listening', () => resolve())
      this.http.listen(port, hostname)
    })
  }

  async run (req, res, next) {
    if (this.hotReloader) {
      try {
        await this.hotReloader.run(req, res, next)
        next()
      } catch (err) {
        next(err)
      }
    }
  }

  readBuildId () {
    const buildIdPath = join(this.dir, this.dist, 'BUILD_ID')
    const buildId = fs.readFileSync(buildIdPath, 'utf8')
    return buildId.trim()
  }
}
