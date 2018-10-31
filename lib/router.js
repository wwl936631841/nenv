import Router from 'vue-router'

// 声明路由，默认到home
const router = new Router({
    /**去除地址栏的# */
    // mode: 'history',
    routes: [{
        path: '/',
        redirect: '/home'
    }],
    linkActiveClass: 'active'
})

// 单点登陆 跳转
router.beforeEach((to, from, next) => {
    let locationHref = window.location.href;
    if (locationHref.indexOf("#/sso") == -1) {
        localStorage.setItem('unfetch.before.redirect', locationHref)
    }

    if (to.path === '/login' && process.env.SSO_URL) {
        let originPathname = `${location.pathname}`;
        let pathname = originPathname && originPathname.indexOf('null') == -1 ? `${location.pathname}` : '';
        let lastTime = localStorage.getItem(pathname + ".unfetch.is.redirect")
        let now = new Date().getTime();
        if (lastTime == null || now - lastTime >= 10000) {
            let beforeUrl = localStorage.getItem('unfetch.before.redirect')
            localStorage.setItem(pathname + '.unfetch.is.redirect', now)
            localStorage.setItem('unfetch.redirect', beforeUrl == null || beforeUrl == '' || beforeUrl.indexOf('/login') > 0 ?
                `${location.origin}` + pathname :
                beforeUrl)
            let redirectUrl = encodeURIComponent(`${location.origin}` + pathname + `#/sso`)
            window.location.href = `${process.env.SSO_URL}?redirect=${redirectUrl}`
        } else {
            next();
        }
    } else {
        next()
    }
})

export default router