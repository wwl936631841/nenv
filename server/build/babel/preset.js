const babelRuntimePath = require.resolve('babel-runtime/package').replace(/[\\/]package\.json/, '')
const relativeResolve = require('../root-module-relative-path')(require)

// function styled

module.exports = (context, opts = {}) => ({
  presets: [
    [require.resolve('babel-preset-env'), {
      modules: false,
      useBuildIns: true,
      ...opts['preset-env']
    }],
    require.resolve('babel-preset-es2015'),
    require.resolve('babel-preset-stage-2'),
    require.resolve('babel-preset-vue-app')
  ],
  plugins: [
    require.resolve('babel-plugin-transform-es2015-modules-commonjs'),
    require.resolve('babel-plugin-transform-object-rest-spread'),
    require.resolve('babel-plugin-transform-class-properties'),
    // require.resolve('babel-plugin-transform-vue-jsx"'),
    // require.resolve('babel-helper-vue-jsx-merge-props'),
    require.resolve('babel-plugin-syntax-dynamic-import'),
    [require.resolve('babel-plugin-transform-runtime'), opts['transform-runtime'] || {}],
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        alias: {
          'babel-runtime': babelRuntimePath,
          'nenv/mixins/inputerMixins': relativeResolve('../../../mixins/inputerMixins'),
          'nenv/lib/unfetch': relativeResolve('../../../lib/unfetch')
        }
      }
    ]
  ]
})
