/* eslint-disable */
require('eventsource-polyfill')
var webpackHotMiddlewareClient = require('webpack-hot-middleware/client?reload=true&&path=/_nenv/webpack-hmr')

export default () => {
  const handlers = {
    reload (route) {
      window.location.reload()
    }
  }

  webpackHotMiddlewareClient.subscribe(function (event) {
    const fn = handlers[event.action]
    if (fn) {
      const data = event.data || []
      fn (...data)
    } else {
      throw new Error('Unexpected action ' + event.action)
    }
  })
}