export default {
  props: {
    nvCode: {
      type: String,
      //required: true
    },
    nvUrl: {
      type: String,
      default: '/dictionary/code'
    }
  },
  created () {
    this.fetchOptions()
  },
  computed: {
    currentValue: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  },
  methods: {
    fetchOptions () {
      const self = this
      if (!self.nvCode) {
        return console.warn("nv-Code not defined")
      }
      window.unfetch({
        url: self.nvUrl,
        methods: 'get',
        params: {
          CODE: self.nvCode
        }
      }).then(({data}) => {
        self.nvOptions = data
      })
    }
  },
  watch: {
    nvCode () {
      this.fetchOptions()
    }
  }
}
