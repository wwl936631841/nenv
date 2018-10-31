
Vue.directive('nv-view', {
  update () {
    console.log(arguments)
  }
})

export default {
  props: {
    disabled: {
      type: Boolean,
      default: undefined
    }
  },
  computed: {
    isNvDisabled () {
      const self = this
      return self.disabled !== undefined ? self.disabled : self.$route.query['nv-view'] === 'true'
    }
  }
}
