import { mapState, mapActions, mapGetters } from 'vuex'
import generateColors from '../lib/color'
export default {
    name: 'Nenv',
    data() {
        return {
            styleEl: null,
            originalStyle: '',
            colors: {
                primary: '#409eff'
            },
            inited: false
        }
    },
    created() {
        const head = document.getElementsByTagName('head')[0]
        const styleEl = document.createElement('style')
        styleEl.type = 'text/css'
        styleEl.className += 'nenv-theme'
        head.appendChild(styleEl)
        this.styleEl = styleEl
        this.getIndexStyle()
        this.activeMenus()
        this.checkPermission()
    },
    computed: {
        ...mapState('platform', {
            title: state => state.title,
            themePalette: state => state.theme.palette
        }),
        ...mapState('user', {
            token: state => state.token
        }),
        ...mapGetters('platform', ['menus', 'allMenus'])
    },
    methods: {
        // 检测是否登陆
        checkPermission() {
            const self = this
            const { token } = self
            if (!token) {
                return self.$router.push(process.env.LOGIN_PATH || '/login')
            }
        },
        // 用于根据url计算当前应该高亮的系统菜单
        activeMenus() {
            const self = this
            const { menus, allMenus } = self
            const route = this.$route
                // url上可能有参数，为了避免匹配失败，删除参数
            const fullPath = route.fullPath.replace(/\?.*/, '')
                // 查找fullPath
            function findX(fullPath, menus) {
                function find(menus, parent) {
                    for (const menu of menus) {
                        menu.crumbName = parent ? `${parent.menuName}/${menu.menuName}` : menu.menuName
                        menu.parents = menu.parents || []
                        if (parent && (menu.parents.indexOf(parent) < 0)) {
                            menu.parents.push(parent)
                        }
                        // 后台的url可能带有参数，为避免匹配失败，删除参数
                        const linkUrl = menu.linkUrl.replace(/\?.*/, '')
                        if (linkUrl === fullPath) {
                            route.meta.$crumbName = menu.crumbName
                            route.meta.$name = menu.menuName
                            self.changeActiveMenu(menu)
                            return menu
                        } else if (menu.childrens && find(menu.childrens, menu)) {
                            return menu
                        }
                    }
                }
                const result = find(menus)
                const shortedPath = fullPath.replace(/\/[^/]*$/, '')
                return result || (shortedPath ? findX(shortedPath, menus) : '')
            }

            self.changeActiveTopMenu(findX(fullPath, menus))
        },
        // element-chalk编译出来css，默认的颜色的map
        getStyleTemplate(data) {
            const colorMap = {
                '#3a8ee6': 'shade-1',
                '#409eff': 'primary',
                '#53a8ff': 'light-1',
                '#66b1ff': 'light-2',
                '#79bbff': 'light-3',
                '#8cc5ff': 'light-4',
                '#a0cfff': 'light-5',
                '#b3d8ff': 'light-6',
                '#c6e2ff': 'light-7',
                '#d9ecff': 'light-8',
                '#ecf5ff': 'light-9'
            }
            Object.keys(colorMap).forEach(key => {
                const value = colorMap[key]
                data = data.replace(new RegExp(key, 'ig'), value)
            })
            return data.replace('nenvPublicPath', window.nenvPublicPath)
        },
        // 请求主题文件
        getIndexStyle() {
            const self = this
            window.unfetch({
                method: 'GET',
                baseURL: '/',
                url: `${window.nenvPublicPath}static/theme-nenv/index.css`,
                responseType: 'text'
            }).then(({ data }) => {
                self.originalStyle = self.getStyleTemplate(data)
                self.colors.primary = self.themePalette.primaryColor
                self.writeNewStyle()
                self.$nextTick(() => {
                    setTimeout(() => {
                        self.inited = true
                    }, 100)
                })
            }).catch(e => {
                console.log(e)
            })
        },
        // 修改css后写到dom
        writeNewStyle() {
            let cssText = this.originalStyle
            this.colors = Object.assign({}, this.colors, generateColors(this.colors.primary))
            Object.keys(this.colors).forEach(key => {
                cssText = cssText.replace(new RegExp('(:|\\s+)' + key, 'g'), '$1' + this.colors[key])
            })
            this.styleEl.innerText = cssText
        },
        ...mapActions('platform', [
            'changeActiveMenu',
            'changeActiveTopMenu'
        ])
    },
    watch: {
        title(val) {
            this.titleEl.innerHTML = val
        },
        // 当路由变化时，检测登陆，计算高亮的菜单
        $route(route) {
            this.activeMenus()
            this.checkPermission()
        },
        // 检测到store内主题颜色变化，生成主题
        'themePalette.primaryColor' (val) {
            this.colors.primary = val
            this.writeNewStyle()
        }
    },
    // render han
    render(h, props) {
        return h('div', {
            domProps: {
                id: 'nenv_root'
            },
            style: { opacity: this.inited ? '' : 0 }
        }, [h('router-view')])
    }
}