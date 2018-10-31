import initNenv, * as nenv from './'
import initWebpackHMR from './webpack-hot-middleware-client'
import './dev.scss'
const devPane = {
  name: "DEVPANE",
  data () {
    return {
      open: false
    }
  },
  methods: {
    triggleOpen () {
      const self = this
      self.open = !self.open
    }
  },
  render (h) {
    const self = this
    return h(
      'div',
      {
        staticClass: 'dev-wrapper'
      },
      [
        h(
          'span',
          {

          },
          [
            '展开'
          ]
        ),
        self.open ? h(
          'div',
          {
            staticClass: 'dev-main'
          },
          [

          ]
        ) : null
      ]
    )
  }
}

const doc = document
initNenv()
    .then(() => {
      initWebpackHMR()
      const el = doc.createElement('div')
      doc.body.appendChild(el)
      const DevPane = Vue.extend(devPane)
      new DevPane().$mount(el)
    })
    .catch((err) => {
      console.error(`${err.message}\n${err.stack}`)
    })
