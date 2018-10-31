import axios from 'axios'
import qs from 'qs'
import { Message } from 'element-ui'
const win = window

const service = axios.create({
  baseURL: process.env.BASE_URL || '/api',
  timeout: 50000,
  transformRequest: [function (data) {
    return qs.stringify(data)
  }]
})

// 弹框登陆用，为了代码好写
service.onTokenExpired = function (callback) {
  return callback()
}

// 请求注入token至header区域
service.interceptors.request.use(
config => {
  const token = nenv.storage.userStorage.token
  if (token) {
    config.headers['Authorization'] = token
  }
  return config
},
error => {
  return Promise.reject(error)
})

// 单点登陆
service.ssoLogin = function () {
  localStorage.setItem('unfetch.redirect', window.location.href)
  let redirectUrl = encodeURIComponent(`${location.origin}${location.pathname}#/sso`)
  window.location.href = `${process.env.SSO_URL}?redirect=${redirectUrl}`
}

// 拦截ajax响应，处理异常和token
service.interceptors.response.use(
response => {
  const { code, data, msg } = response.data
  const { headers, responseType } = response.config

  if (responseType === 'text') {
  } else if (code === 0) {
    service.successed = true
    response.data = data
  } else if (code === 2) { // token失效
    // 如果有token失效的回调 并且头部区域没有Nv-Login: false标志, 则回调改函数
    if (service.onTokenExpired && !headers['Nv-Login-Disabled']) {
      // 如有有弹框登陆，弹框登陆不会调用这里面的回调，如果没有则会调用弹框登陆
      return service.onTokenExpired(function () {
        if (process.env.SSO_URL) {
          service.ssoLogin()
        } else {
          win.nenv.raw.router.push(process.env.LOGIN_PATH || '/login')
        }
        return Promise.reject(response.data)
      })
    } else {
      if (process.env.SSO_URL) {
        return service.ssoLogin()
      }
      win.nenv.raw.router.push(process.env.LOGIN_PATH || '/login')
      return Promise.reject(response.data)
    }
  } else if (code === 3 || code === 4) {
    /* eslint-disable no-new */
    new Message({
      type: 'error',
      message: msg
    })
    return Promise.reject(response.data)
  } else {
    return Promise.reject(response.data || response)
  }

  response.rawData = {
    code,
    data,
    msg
  }
  return response
},
error => {
  console.log(error)
  return Promise.reject(error)
})

const messageCbs = {}

// 模拟window的open，但是这个会自动拼接token至参数
service.open = function (url, opts = {}) {
  const { params = {}, options = {} } = opts

  Object.keys(params).map((key) => {
    if (!params[key]) {
      delete params[key]
    }
  })

  // 如果不是http 或者 https开头 则不注入/api 前缀
  if (!(/https?:\/\//.exec(url))) {
    if (options.prefix) {
      url = (process.env.BASE_URL || '/api') + `/${url}`
    }

    // 如果未禁止token, 则注入token
    if (options.token) {
      params.Authorization = nenv.storage.userStorage.token
    }
  }

  Object.keys(params).map(key => {
    if (params[key] === undefined || params[key] === null) {
      delete params[key]
    }
  })

  url = `${url}?${qs.stringify(params)}`

  const page = window.open(url)
  const wName = `nv-${Math.random().toFixed(10)}`

  page.name = wName

  return {
    onmessage (name, cb) {
      messageCbs[wName] = messageCbs[name] || {}
      messageCbs[wName][name] = messageCbs[wName][name] || []
      messageCbs[wName][name].push(cb)
    }
  }
}

/**  跨窗口通信用 */
service.postMessage = (msg) => {
  const params = {
    nenv: true,
    msg,
    name: window.name,
    page: document.referrer
  }
  window.opener.postMessage(params, location.origin)
}

service.download = function (url, opts = { }) {
  opts.options = opts.options
  opts.options = Object.assign({}, { token: true, prefix: true }, opts.options)
  service.open(url, opts)
}

service.onmessage = function (data) {
  debugger
  if (messageCbs[data.name]) {
    messageCbs[data.name].forEach(cb => {
      cb(data)
    })
  }
}

window.onmessage = ({data}) => {
  if (data && data.nenv) {
    service.onmessage(data)
  }
}

window.addEventListener('beforeunload', () => {
  return 'quitxxx'
})

export default service
