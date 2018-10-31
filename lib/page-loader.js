import EventEmitter from './EventEmitter'
import pathToRegexp from 'path-to-regexp'

const webpackModule = module

export default class PageLoader {
  constructor (buildId, assetPrefix) {
    const self = this
    self.buildId = buildId
    self.assetPrefix = assetPrefix

    const pageCache = {}
    this._pageCache = pageCache
    self.pageCache = new Proxy(pageCache, {
      get (target, prop, receiver) {
        const route = self.match(prop)
        return target[route]
      },
      set (target, prop, value) {
        const route = self.match(prop)
        target[route] = value
        return true
      }
    })
    self.pageLoadedHandlers = {}
    self.pageRegisterEvents = new EventEmitter()
    self.loadingRoutes = {}

    self.chunkRegisterEvenvs = new EventEmitter()
    self.loadingChunks = {}

    const routes = {}
    self._routes = routes
    self.routes = new Proxy({}, {
      get (target, prop, receiver) {
        const route = self.match(prop)
        return routes[route]
      },
      set (target, prop, value) {
        routes[prop] = value
        return true
      }
    })
    self.routes['/err401'] = {
      url: `${window.nenvPublicPath}bundles/pages/errors/index.js`
    }
    self.routes['/err404'] = {
      url: `${window.nenvPublicPath}bundles/pages/errors/index.js`
    }
    this.config(window.nenvPageLoaderConfig)
  }

  match (route) {
    const routes = this._routes
    if (routes[route]) {
      return route
    } else {
      for (let key of Object.keys(routes)) {
        const r = routes[key]
        if (r.regex && r.regex.exec(route) && (key !== '*')) {
          return key
        }
      }
    }
  }

  config (routes) {
    for (let route of routes) {
      const path = route.replace(/.*\/bundles\/pages/, '').replace('.js', '').replace(/(^|\/)index$/, '').replace(/_/g, ':')
      this.routes[path] = {
        url: route,
        regex: pathToRegexp(path)
      }
    }
  }

  normalizeRoute (route) {
    const { routes } = this
    route = this.match(route)
    if (!routes[route]) {
      // return {
      //   route,
      //   url: routes[route].url
      // }
      route = this.match('/err404')
    }
    return {
      route,
      url: routes[route].url
    }
    // throw new Error('xxxx')
  }

  async loadPage (router) {
    const { route, url } = this.normalizeRoute(router)
    return new Promise((resolve, reject) => {
      const fire = ({ error, page }) => {
        this.pageRegisterEvents.off(route, fire)
        delete this.loadingRoutes[url]

        if (error) {
          reject(error)
        } else {
          resolve(page)
        }
      }

      const cachedPage = this.pageCache[route]
      if (cachedPage) {
        const { error, page } = cachedPage
        error ? reject(error) : resolve(page)
        return
      }

      this.pageRegisterEvents.on(route, fire)

      if (!this.loadingRoutes[url]) {
        this.loadScript(url)
        this.loadingRoutes[url] = true
      }
    })
  }

  // 加载script
  loadScript (route) {
    let scriptRoute = route
    const script = document.createElement('script')
    const url = `${this.assetPrefix}${scriptRoute}`
    script.type = 'text/javascript'
    script.src = url
    script.onerror = () => {
      const error = new Error(`Error when loading route: ${route}`)
      this.pageRegisterEvents.emit(route, { error })
    }

    document.body.appendChild(script)
  }

  // 标记已经加载的页面
  registerPage (route, regFn) {
    const register = () => {
      try {
        const { error, page } = regFn()
        this.pageCache[route] = { error, page }
        this.pageRegisterEvents.emit(route, { error, page })
      } catch (error) {
        debugger
        this.pageCache[route] = { error }
        this.pageRegisterEvents.emit(route, { error })
      }
    }

    if (webpackModule && webpackModule.hot && webpackModule.hot.status()) {
      // console.log(`Waiting for webpack to become "idle" to initialize the page: "${route}"`)

      const check = (status) => {
        if (status === 'idle') {
          webpackModule.hot.removeStatusHandler(check)
          register()
        }
      }
      webpackModule.hot.status(check)
    } else {
      register()
    }
    register()
  }
}
