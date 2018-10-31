import unfetch from '../lib/unfetch'

export function tokenLogin (params) {
  return unfetch({
    url: 'user/info',
    method: 'get',
    params
  }).then((res) => {
    return res
  })
}

export function userLogin (params) {
  return unfetch({
    url: 'user/login',
    method: 'post',
    data: params
  })
}

export function userLogout () {
  return unfetch({
    url: '/user/logout',
    method: 'post',
    headers: {
      'Nv-Login-Disabled': true
    }
  })
}

export function platformFetchMenus (params, options) {
  return unfetch({
    url: '/user/menu',
    method: 'get',
    params,
    ...options
  })
}
