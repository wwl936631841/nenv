import 'es6-promise'
import Vue from 'vue'
import Router from 'vue-router'
import Vuex, { Store } from 'vuex'
import ElementUI from 'element-ui'
import Nprogress from 'nprogress'
import 'normalize.css/normalize.css'
import '../styles/nenv.scss'

import PageLoader from '../lib/page-loader'
import unfetch from '../lib/unfetch'

import * as filters from '../lib/filters'
import router from '../lib/router'

import logo from '../lib/logo'

import { StorageBuilder } from '../lib/storage'

import App from './App'

import '../lib/i18n'

import { userLogin, userLogout, platformFetchMenus, tokenLogin } from './api'
// import utils from './utils'

// 全局声明ajax库
window.unfetch = unfetch

// 全局注册filters
Object.keys(filters).forEach(x => {
    Vue.filter(x, filters[x])
    Vue.prototype[x] = filters[x]
})

// 在vue的原型链上注入fetch库，用法 this.$fetch
Vue.prototype.$unfetch = unfetch

// 全局bus this.$bus.$emit this.$bus.$on
const bus = new Vue()
Vue.prototype.$bus = bus

// 注册路由和注册store
Vue.use(Router)
Vue.use(Vuex)

/**      修改element UI默认属性             **/
ElementUI.Form.props.labelWidth = {
    type: String,
    default: '86px'
}

ElementUI.Form.props.labelPosition = {
    type: String,
    default: 'right'
}

ElementUI.FormItem.props.nvLayout = {
    type: String,
    default: 'half'
}

ElementUI.Dialog.props.top.default = '10vh'

ElementUI.Dialog.props.width = {
    type: String,
    default: '65%'
}

ElementUI.TableColumn.props.showOverflowTooltip = {
    type: Boolean,
    default: true
}

ElementUI.Dialog.props.closeOnClickModal = {
    type: Boolean,
    default: false
}

// 特殊初始化element ui,  使el-dialog内的nv-layout标签的面包屑隐藏
ElementUI.Dialog.mixins.push({
    watch: {
        visible(val) {
            if (val) {
                this.$nextTick(() => {
                        // const vComp = this.$children[0].$children[0]
                        const vComp = this.$children[0]
                        if (vComp && vComp.isDynamicView !== undefined) {
                            vComp.isDynamicView = true
                        }
                    })
                    // debugger
                    // this.$children.map(children => {
                    //   try {
                    //     children.$created()
                    //   } catch (e) {

                //   }
                // })
            }
        }
    }
})

ElementUI.Card.mixins = ElementUI.Card.mixins || []

// 特殊化处理element ui， 使el-dialog内的nv-layout的面包屑消失
ElementUI.Card.mixins.push({
    mounted() {
        const vComp = this.$children[0]
            // const vComp = this.$children[0].$children[0]
        if (vComp && vComp.isDynamicView !== undefined) {
            vComp.isDynamicView = true
        }
    }
})

// 启用自定义大小
Vue.use(ElementUI, {
    size: 'nenv'
})

// 平台可编辑视图指令，当
Vue.directive('nv-view', {
    bind(el, binding, vnode) {
        const { modifiers } = binding
        if (modifiers.display) {
            el.style.display = router.app.$route.query['nv-view'] === 'true' ? 'none' : ''
        }
    },
    update(el, binding) {
        const { modifiers } = binding
        if (modifiers.display) {
            el.style.display = router.app.$route.query['nv-view'] === 'true' ? 'none' : ''
        }
    }
})

const buildId = ''
const assetPrefix = ''
const pageLoader = new PageLoader(buildId, assetPrefix)

window.Vue = Vue
window.__NENV_REGISTER_PAGE = pageLoader.registerPage.bind(pageLoader)

const nenv = {
    version: process.env.VERSION,
    project: process.env.project || {},
    bus,
    raw: {},
    layouts: {},
    stores: {},
    flatRoutes: [],
    routes: [],
    pageLoader,
    i18n: null,
    lib: {
        StorageBuilder
    }
}
Vue.prototype.pageLoader = pageLoader
Vue.prototype.project = nenv.project

// 路由跳转加载条开始
router.beforeEach((to, from, next) => {
    Nprogress.start()
    next()
})

// 路由跳转加载条结束
router.afterEach(() => {
    Nprogress.done()
})

nenv.raw.router = router

// 存储器
const platformStorage = (new StorageBuilder('platform', {
    menus: Array,
    layout: String,
    persmissons: JSON,
    theme: JSON
})).storage

// 存储器
const userStorage = (new StorageBuilder('user', {
    home: String,
    profile: JSON,
    token: String
})).storage

// 添加到全局nenv， 方便调试
nenv.storage = {
    platformStorage,
    userStorage
}

// 声明store
const store = new Store({
    modules: {
        // 应用
        app: {
            namespaced: true,
            state: {
                theme: 'default'
            }
        },
        // 平台
        platform: {
            namespaced: true,
            state: {
                title: document.getElementsByTagName('title')[0].innerHTML,
                // 平台菜单
                menus: platformStorage.menus,
                // 是否显示home
                isHomeMenuShow: true,
                // 主题
                theme: {
                    palette: {
                        ...Object.assign({
                                primaryColor: '#3B8CFF'
                            },
                            (platformStorage.theme || {}).palette
                        )
                    },
                    classes: {

                    }
                },
                layouts: [],
                layout: platformStorage.layout,
                // 选中的菜单
                acitveMenu: {},
                // 选中的一级菜单
                activeTopMenu: {},
                persmissons: Object.assign({
                    urls: {}
                }, platformStorage.persmissons)
            },
            mutations: {
                ADD_LAYOUT: (state, layout) => {
                    state.layouts.push(layout)
                },
                CHANGE_LAYOUT: (state, layout) => {
                    platformStorage.layout = layout
                },
                UPDATE_TITLE: (state, title) => {
                    state.title = title
                },
                UPDATE_MENUS: (state, menus) => {
                    state.menus = menus
                    platformStorage.menus = menus
                },
                UPDATE_ACTIVE_TOP_MENU: (state, menu) => {
                    state.activeTopMenu = menu
                },
                UPDATE_ACTIVE_MENU: (state, menu) => {
                    state.acitveMenu = menu
                },
                UPDATE_HOME_MENU: (state, isShow) => {
                    state.isHomeMenuShow = isShow
                },
                UPDATE_THEME: (state, { classes, palette }) => {
                    state.theme.palette = Object.assign(state.theme.palette, palette)
                    platformStorage.theme = state.theme
                },
                ADD_PERMISSION_URL: (state, urls = []) => {
                    if (!Array.isArray(urls)) {
                        urls = [urls]
                    }
                    urls.forEach(url => {
                        let paths = {}
                        paths[url] = true
                        Object.assign(state.persmissons.urls, paths)
                        url = url.replace(/\?.*$/g, '')
                        state.persmissons.urls[url] = true
                    })
                    platformStorage.persmissons = state.persmissons
                }
            },
            actions: {
                async fetchMenus({ commit, state }, { token } = {}) {
                    const menus = (await platformFetchMenus({}, {
                        headers: {
                            Authorization: token
                        }
                    })).data

                    function loop(menus, urls = []) {
                        for (let menu of menus) {
                            if (menu.linkUrl) {
                                urls.push(menu.linkUrl)
                            }
                            if (menu.childrens) {
                                loop(menu.childrens, urls)
                            }
                        }
                        return urls
                    }
                    await commit('ADD_PERMISSION_URL', loop(menus))
                    commit('UPDATE_MENUS', menus)
                },
                async enableHomeMenu({ commit }, flag) {
                    commit('UPDATE_HOME_MENU', flag)
                },
                async changeTitle({ commit, state }, title) {
                    commit('UPDATE_TITLE', title)
                },
                async changeActiveMenu({ commit, state }, menu) {
                    commit('UPDATE_ACTIVE_MENU', menu || {})
                },
                async changeActiveTopMenu({ commit, state }, menu) {
                    commit('UPDATE_ACTIVE_TOP_MENU', menu || {})
                },
                async changePlatformLayout({ commit, state }, layout) {
                    commit('CHANGE_LAYOUT', layout)
                },
                async theming({ commit, state }, { classes, palette } = {}) {
                    commit('UPDATE_THEME', { classes, palette })
                },
                async logout({ commit, state }) {
                    platformStorage.$clear(true)
                }
            },
            getters: {
                menus(state) {
                    function loop(menus) {
                        const filteredMenus = []
                        for (let menu of menus) {
                            if (menu.menuType === 'menu') {
                                if (menu.childrens) {
                                    const childrens = loop(menu.childrens)
                                    if (childrens && childrens.length > 0) {
                                        menu.childrens = childrens
                                    } else {
                                        delete menu.childrens
                                    }
                                }
                                filteredMenus.push(menu)
                            }
                        }
                        return filteredMenus
                    }
                    const menus = JSON.parse(JSON.stringify(state.menus))
                    return state.isHomeMenuShow ? [{
                        linkType: '1',
                        linkUrl: '/home',
                        menuName: '首页'
                    }].concat(loop(menus)) : loop(menus)
                },
                // 计算所有的菜单
                allMenus(state) {
                    return state.isHomeMenuShow ? [{
                        linkType: '1',
                        linkUrl: '/home',
                        menuName: '首页'
                    }].concat(state.menus) : state.menus
                },
                // 计算应该显示的菜单
                menuPaths(state) {
                    function find(menus) {
                        const mp = []
                        menus.forEach((menu) => {
                            if (menu.linkType === '1') {
                                mp.push(menu.linkUrl)
                            }

                            if (menu.childrens) {
                                mp.push(...find(menu.childrens))
                            }
                        })
                        return mp
                    }
                    return find(state.menus)
                }
            }
        },
        // 用户
        user: {
            namespaced: true,
            state: {
                token: userStorage.token,
                home: userStorage.home,
                profile: userStorage.profile
            },
            mutations: {
                'DELETE_TOKEN': (state) => {
                    // localStorage
                    localStorage.removeItem('user.token')
                    state.token = null
                },
                'UPDATE_TOKEN': (state, token) => {
                    userStorage.token = token
                    state.token = token
                },
                'UPDATE_PROFILE': (state, profile) => {
                    userStorage.profile = profile
                    state.profile = profile
                },
                'UPDATE_HOME': (state, home) => {
                    userStorage.home = home
                    state.home = home
                }
            },
            actions: {
                // 登陆总入口
                async userLogin({ commit, dispatch }, credential) {
                    const { token, user, homePath } = (await userLogin(credential)).data
                    await commit('UPDATE_TOKEN', token)
                    await commit('UPDATE_PROFILE', user)
                    await commit('UPDATE_HOME', homePath)
                },
                // 登出总入口
                async logout({ commit, dispatch }) {
                    await userLogout()
                    userStorage.$clear(true)
                    commit('DELETE_TOKEN')
                },
                // 单点登陆总入口
                async ssoLogin({ commit, dispatch }, credential) {
                    await commit('UPDATE_TOKEN', credential.token)
                    const { user, homePath } = (await tokenLogin()).data
                    await commit('UPDATE_PROFILE', user)
                    await commit('UPDATE_HOME', homePath)
                }
            }
        }
    },
    actions: {
        // 登陆
        async login({ commit, dispatch, state }, credential) {
            await dispatch('user/userLogin', credential)
            await dispatch('platform/fetchMenus', { token: state.user.token })
        },
        // 登出
        async logout({ commit, dispatch, state }) {
            await dispatch('user/logout')
                /* 退出登录时清空平台资源*/
                // await dispatch('platform/logout')
            if (process.env.SSO_URL) {
                unfetch.ssoLogin()
            }
            nenv.bus.$emit('on-logout')
        },
        // 单点登陆获取用户信息
        async userInfo({ commit, dispatch, state }, token) {
            await dispatch('user/ssoLogin', { token: token })
            await dispatch('platform/fetchMenus', { token: token })
            let url = localStorage.getItem('unfetch.redirect')
            window.location.href = url
        }
    }
})
nenv.raw.store = store

pageLoader.loadPage('/err404')

// 异步加载
router.beforeEach((to, from, next) => {
    // 检测cache 在pageLoader的then里面有bug
    if (nenv.pageLoader.pageCache[to.path]) {
        return next()
    }
    const { path } = to
    pageLoader.loadPage(path)
        .then(() => {
            return next(to.fullPath)
        })
        .catch(() => {
            next()
        })
})

// 权限系统
router.beforeResolve((to, from, next) => {
    //debugger
    const token_temp = nenv.storage.userStorage.token
    if (!token_temp) {
        next();
        return;
    }
    const urls = store.state.platform.persmissons.urls
    const { path, meta } = to
    if (meta['nvPermission'] === false || urls[path]) {
        next()
    } else {
        console.log(`url[${to.path}]被平台权限系统拦截`)
        next('/err401')
    }
})

// 平台资源加载器
export const loader = (options = {}) => {
    if (typeof options === 'function') {
        options = options()
    }

    // console.log(options)

    // routerDepth 用来表明页面的路由深度
    let { layout, store, i18n, router, path, routerDepth } = options

    // 如果有store 则注册store
    if (store) {
        if (store.namespaced !== false) {
            store.namespaced = true
        }
        nenv.raw.store.registerModule(store.name, store)
        nenv.stores[store.name] = store
    }

    // 如果有布局 则注册布局
    if (layout) {
        // 声明组件是布局文件
        nenv.raw.store.commit('platform/ADD_LAYOUT', {
            label: layout.label,
            name: layout.name
        })
        nenv.layouts[layout.name] = layout
    }

    // 如果有翻译器
    if (i18n) {
        nenv.i18n = i18n
    }

    // 如果options的render是函数，则认为options 是路由文件
    if (typeof options.render === 'function') {
        // path = options.path
        router = options
    }

    // 如果有路由
    if (router) {
        try {
            router.beforeCreate = router.beforeCreate || []
            router.mixins = router.mixins || []
            router.mixins.push({
                props: {
                    nvPage: {
                        type: Object,
                        default () {
                            return {}
                        }
                    }
                },
                data() {
                    return {
                        page: {}
                    }
                }
            })
            router.beforeCreate.push(function() {

            })
        } catch (e) {
            console.log(router)
        }

        // 如果router的render属性是函数， 则认为是vue组件
        if (typeof router.render === 'function') {
            // 如果申明为跟路由
            if (routerDepth === 0) {
                router = {
                    path,
                    component: router,
                    meta: router.meta || {}
                }
            } else {
                router = {
                    path,
                    children: [{
                        path,
                        component: router,
                        meta: router.meta || {}
                    }]
                }
            }
        }
        // 此处应该是路由数组
        if (!Array.isArray(router)) {
            router = [router]
        }

        // 递归处理meta，路由父子关系
        recursivelyProcessRoute(router)

        nenv.routes = nenv.routes.concat(router)
        nenv.raw.router.addRoutes(router)
            // 加入路由后才能触发
        setTimeout(() => {
            router.forEach(router => {
                nenv.pageLoader.registerPage(router.path, () => { return { page: router.component } })
            })
        })
    }
}

function recursivelyProcessRoute(routes, { parent = '' } = {}) {
    routes.forEach(router => {
        router.meta = router.meta || {}
        router.meta['$parent'] = parent

        // 如果有子路由
        if (router.children) {
            // 如果有子路由但没有声明不觉组件,则自动注入布局组件
            if (!router.component) {
                router.component = getLayout()
            } else {
                nenv.flatRoutes.push({ path: router.path, component: router.component })
            }

            // 递归处理路由
            recursivelyProcessRoute(router.children, { parent: `${parent}${router.path}` })
        } else {
            router.props = { right: true }
            nenv.flatRoutes.push({ path: router.path, component: router.component })
        }
    })
}

// 获取将使用的布局
export const getLayout = (name) => {
    const { layouts } = nenv
    if (Object.keys(layouts) === 0) {
        throw new Error('there is no layout loaded')
    } else if (name) {
        if (layouts[name]) {
            return layouts[name]
        } else {
            throw new Error(`loaded layouts has no layout with name:${name}`)
        }
    } else {
        name = platformStorage.layout || Object.keys(layouts)[0]
        return getLayout(name)
    }
}

// 声明挂载函数
export const mount = () => {
    const { raw, i18n } = nenv
    raw.router = router
    raw.store = store
    raw.root = new Vue({
        el: '#nenv',
        router,
        store,
        i18n,
        render: h => h(App)
    })
}

nenv.platformStorage = platformStorage

nenv.loader = loader

window.nenv = nenv
nenv.bootstrap = mount
export default async() => {
    console.log(`
Version: ${nenv.version}
Have a great day! 📣🐢
  `)
    console.log(logo)
}