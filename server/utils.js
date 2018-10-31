const { join } = require('path')

module.exports = {
  IS_BUNDLED_PAGE: /^bundles[/\\]pages.*\.(js|vue)$/,
  MATCH_ROUTE_NAME: /^bundles[/\\]pages[/\\](.*)\.(js|vue)$/
}
