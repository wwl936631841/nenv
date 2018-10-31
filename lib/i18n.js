import Vue from 'vue'
import unfetch from './unfetch'

Vue.mixin({
    data() {
        return {
            ntd: {},
            ntr: {}
        }
    }
})

function i18n(code, url) {
    const { ntd, $set } = this
    const array = code.split('.')
    try {
        let len = array.length
        return [ntd, ...array].reduce(function(a, b) {
            if (len-- > 1 && a[b] === undefined) {
                $set(a, b, {})
                unfetch.get(url || i18n.url, {
                    params: { CODE: array[0] }
                }).then(({ data }) => {
                    data.forEach(item => {
                        $set(a[b], item.VALUE, item.NAME)
                    })
                })
            }
            return a[b]
        })
    } catch (e) {
        console.log(e)
    }
}

i18n.url = '/dictionary/code'

function i18r(code, url) {
    const { ntr, $set } = this
    code += ''
    if (ntr[code]) {
        return ntr[code]
    }
    unfetch.get(url || i18r.url, {
        params: { CODE: code }
    }).then(({ data }) => {
        $set(ntr, code, data)
    })
}

i18r.url = '/region/queryname'

Vue.prototype.$nr = i18r

Vue.prototype.$nt = i18n