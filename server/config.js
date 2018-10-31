const { join } = require('path')
const { existsSync } = require('fs')

const cache = new Map()

const defaultConfig = {
  webpack: null,
  webpackDevMiddleware: null,
  poweredByHeader: true,
  distDir: '.nenv',
  assetPrefix: '',
  assetPublicPath: '/',
  configOrigin: 'default',
  useFileSystemPublicRoutes: true,
  layoutsGlobPattern: 'layouts/**/*.+(js|vue)',
  pagesGlobPattern: 'pages/**/*.nenv.+(js|vue)',
  project: {
    title: 'nenv 开发工具'
  }
}

module.exports = function getConfig (dir, customConfig) {
  if (!cache.has(dir)) {
    cache.set(dir, loadConfig(dir, customConfig))
  }
  return cache.get(dir)
}

function loadConfig (dir, customConfig) {
  if (customConfig && typeof customConfig === 'object') {
    customConfig.configOrigin = 'server'
    return withDefaults(customConfig)
  }
  const path = join(dir, 'nenv.config.js')

  let userConfig = {}

  const userHasConfig = existsSync(path)
  if (userHasConfig) {
    const userConfigModule = require(path)
    userConfig = userConfigModule.default || userConfigModule
    userConfig.configOrigin = 'nenv.config.js'
  }

  return withDefaults(userConfig)
}

function withDefaults (config) {
  config.project = Object.assign({}, defaultConfig.project, config.project || {})
  return Object.assign({}, defaultConfig, config)
}
