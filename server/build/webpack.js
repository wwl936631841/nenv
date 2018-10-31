const { resolve, join, sep } = require('path')
const { createHash } = require('crypto')
const { realpathSync, existsSync } = require('fs')
const webpack = require('webpack')
const glob = require('glob-promise')
const WriteFilePlugin = require('write-file-webpack-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const CaseSensitivePathPlugin = require('case-sensitive-paths-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const UnlinkFilePlugin = require('./plugins/unlink-file-plugin')
const PagesPlugin = require('./plugins/pages-plugin')
const HtmlWebpckPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const { styleLoaders, assetsPath } = require('./utils')
const vueLoaderOptions = require('./vue-loader.conf')

const CombineAssetsPlugin = require('./plugins/combine-assets-plugin')
const getConfig = require('../config')
const babelCore = require('babel-core')
const findBabelConfig = require('./babel/find-config')
const rootModuleRelativePath = require('./root-module-relative-path')
const pkg = require('../../package')

const defaultPages = [
]

const nenvDir = join(__dirname, '..', '..')

const nenvPagesDir = join(__dirname, '..', '..', 'pages')
const nenvNodeModulesDir = join(__dirname, '..', '..', 'node_modules')
const interpolateNames = new Map(defaultPages.map((p) => {
  return [join(nenvPagesDir, p), `dist/pages/${p}`]
}))

const relativeResolve = rootModuleRelativePath(require)

module.exports = async function createCompiler (dir, { dev = false, quiet = false, buildDir, conf = null } = {}) {
  dir = realpathSync(resolve(dir))
  const config = getConfig(dir, conf)
  // 默认入口文件
  const defaultEntries = dev ? [
    join(__dirname, '..', '..', 'client', 'webpack-hot-middleware-client'),
    join(__dirname, '..', '..', 'client', 'on-demand-entries-client')
  ] : []
  const mainJS = dev
        ? require.resolve('../../client/nenv-dev') : require.resolve('../../client/nenv')

  let totalPages

  // 入口文件
  const entry = async () => {
    const entries = {
      'main.js': [
        'babel-polyfill',
        ...defaultEntries,
        ...config.clientBootstrap || [],
        mainJS,
        join(dir, 'entry.js')
      ]
    }

    // 扫描页面
    const pages = await glob(config.pagesGlobPattern, { cwd: dir })
    // console.log('globPages', pages, dir)
    const devPages = pages.filter((p) => true)

    if (dev) {
      for (const p of devPages) {
        entries[join('bundles', p.replace(/\.nenv\./g, '.').replace('.vue', '.js')).replace(/\\/g, '/')] = [`./${p}?entry`]
      }
    } else {
      for (const p of pages) {
        entries[join('bundles', p.replace(/\.nenv\./g, '.').replace('.vue', '.js')).replace(/\\/g, '/')] = [`./${p}?entry`]
      }
    }

    entries['bootstrap.js'] = join(__dirname, '..', '..', 'client', 'bootstrap')

    totalPages = pages.filter((p) => true).length + 1
    return entries
  }

  const plugins = [
    new webpack.IgnorePlugin(/(precomputed)/, /node_modules.+(elliptic)/),
    new webpack.LoaderOptionsPlugin({
      options: {
        context: dir,
        customInterpolateName (url, name, opts) {
          return interpolateNames.get(this.rosourcePath) || url
        }
      }
    }),
    new WriteFilePlugin({
      exitOnerrors: false,
      log: true,
      useHashIndex: false
    }),
    // 分拆合并js
    new webpack.optimize.CommonsChunkPlugin({
      name: 'commons',
      filename: 'commons.js',
      minChunks (module, count) {
        // console.log(module.context)
        if (module.context && module.context.indexOf(`${sep}nenv${sep}`) >= 0) {
          return true
        }
        if (dev) {
          return false
        }

        if (totalPages <= 2) {
          return count >= totalPages
        }

        return count >= totalPages * 0.5
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      filename: 'manifest.js'
    }),
    // 定义开发/生产模式
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production')
    }),
    // 定义资源路径/ 生产模式时需要
    new webpack.DefinePlugin({
      'process.env.assetPublicPath': JSON.stringify(config.assetPublicPath)
    }),
    // 定义版本号
    new webpack.DefinePlugin({
      'process.env.VERSION': `'${pkg.version}'`
    }),
    // 将nenv.config.js内的project定义一下
    new webpack.DefinePlugin({
      'process.env.project': JSON.stringify(config.project)
    }),
    // 页面处理插件
    new PagesPlugin(),
    // 忽略文件名大小写插件
    new CaseSensitivePathPlugin()
  ]

  if (dev) {
    // 开发模式html模板
    plugins.push(
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      new UnlinkFilePlugin(),
      new HtmlWebpckPlugin({
        title: config.project.title,
        assetPublicPath: '/',
        filename: 'index.html',
        template: join(__dirname, '../../client', 'app.ejs'), // 'index.html',
        inject: false,
        chunksSortMode: function (chunk1, chunk2) {
          const order = [ 'main.js', 'commons', 'manifest' ]
          return order.indexOf(chunk2.names[0]) - order.indexOf(chunk1.names[0])
        }
        // chunks: [ 'main.js', 'commons', 'manifest', 'bootstrap.js' ]
      })
    )
    if (!quiet) {
      plugins.push(new FriendlyErrorsWebpackPlugin())
    }
    // plugins.push(
    //   HtmlWebpckPlugin
    // )
  } else {
    // 生产模式html
    plugins.push(new HtmlWebpckPlugin({
      title: config.project.title,
      assetPublicPath: config.assetPublicPath,
      filename: 'index.html',
      template: join(__dirname, '../../client', 'app.ejs'),
      // template: join(__dirname, 'clent') ,//'index.html',
      inject: false,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      },
      chunksSortMode: 'dependency'
    }))
    plugins.push(
      new ExtractTextPlugin({
        filename: 'css/[name].css'
      }),
      new OptimizeCSSPlugin({
        cssProcessorOptions: {
          safe: true
        }
      }))
    // 忽略常见错误
    plugins.push(new webpack.IgnorePlugin())
    plugins.push(
            new CombineAssetsPlugin({
              input: ['manifest.js', 'commons.js', 'main.js'],
              output: 'app.js'
            }),
            new UglifyJSPlugin({
              parallel: true,
              sourceMap: false,
              uglifyOptions: {
                compress: {
                  comparisons: false
                }
              }
            })
        )
    plugins.push(new webpack.optimize.ModuleConcatenationPlugin())
    // 拷贝static静态资源文件
    plugins.push(new CopyWebpackPlugin([
      {
        from: resolve(dir, 'static'),
        to: join(buildDir, '.nenv', 'static'),
        ignore: ['.*']
      }
    ]))
  }

  const nodePathList = (process.env.NODE_PATH || '')
        .split(process.platform === 'win32' ? ';' : '')
        .filter((p) => !!p)

  const mainBabelOptions = {
    cacheDirectory: true,
    presets: []
  }

  // 处理babel相关
  const externalBabelConfig = findBabelConfig(dir)
  if (externalBabelConfig) {
    console.log(`> Using external babel configuration`)
    console.log(`> Location: ${externalBabelConfig.loc}`)

    const { options } = externalBabelConfig
    mainBabelOptions.babelrc = options.babelrc !== false
  } else {
    mainBabelOptions.babelrc = false
  }

  if (!mainBabelOptions.babelrc) {
    mainBabelOptions.presets.push(require.resolve('./babel/preset'))
  }

  const rules = (dev ? [
    {
      test: /\.(js|vue)(\?[^?]*)?$/,
      loader: 'hot-self-accept-loader',
      include: [
        join(dir, 'pages')
      ]
    },
    ...styleLoaders({
      sourceMap: true})
  ] : [...styleLoaders({
    extract: true
  })])
    .concat([
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.(js|vue|json)(\?[^?]*)?$/,
        loader: 'emit-file-loader',
        include: [dir, nenvPagesDir],
        exclude (str) {
          return /node_modules/.test(str) && str.indexOf(nenvPagesDir) !== 0
        },
        options: {
          name: 'dist/[path][name].[ext]',
          interpolateName: (name) => name.replace('.vue', '.js'),
          validateFileName (file) {
            const cases = [{from: '.js', to: '.vue'}, {from: '.vue', to: '.js'}]

            for (const item of cases) {
              const { from, to } = item
              if (file.slice(-(from.length)) !== from) {
                continue
              }

              const filePath = file.slice(0, -(from.length)) + to

              if (existsSync(filePath)) {
                throw new Error(`Both ${from} and ${to} file found. Please make surce you only have one of both`)
              }
            }
          },
          transfrom ({ content, sourceMap, interpolatedName }) {
            if (!(/\.(js|vue)$/.test(interpolatedName))) {
              return { content, sourceMap }
            }

            const babelRuntimePath = require('babel-runtime/package').replace(/[\\/]package\.json$/, '')
            const transpiled = babelCore.transform(content, {
              babelrc: false,
              sourceMap: dev ? 'both' : false,

              plugins: [
                // require.resolve
                [require.resolve('babel-plugin-transfrom-es2015-modules-commonjs')],
                [
                  require.resolve('babel-plugin-module-resolver'),
                  {
                    alias: {
                      'babel-runtime': babelRuntimePath,
                      'nenv/mixins/inputerMixins': relativeResolve('../../mixins/inputerMixins'),
                      'nenv/lib/unfetch': relativeResolve('../../lib/unfetch')
                    }
                  }
                ]
              ],
              inputSourceMap: sourceMap
            })

            let { map } = transpiled
            let output = transpiled.code

            if (map) {
              let nodeMap = Object.assign({}, map)
              nodeMap.sources = nodeMap.sources.map((source) => source.replace(/\?entry/, ''))
              delete nodeMap.sourcesContent

              const sourceMapUrl = Buffer.from(JSON.stringify(nodeMap), 'utf-8').toString('base64')
              output = `${output}\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${sourceMapUrl}`
            }

            return {
              content: output,
              sourceMap: transpiled.map
            }
          }
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderOptions
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [nenvDir],
        exclude (str) {
          return /node_modules/.test(str.replace(nenvDir, ''))
        },
        options: {
          //
          babelrc: false,
          cacheDirectory: true,
          presets: [require.resolve('./babel/preset')]
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: assetsPath('img/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: assetsPath('fonts/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(webm|mp4)$/,
        loader: 'file-loader',
        options: {
          name: 'videos/[name].[hash:7].[ext]'
        }
      },
      // 项目目录的 babel loader
      {
        test: /\.js(\?[^?]*)?$/,
        loader: 'babel-loader',
        include: [dir],
        exclude (str) {
          return /node_modules/.test(str)
        },
        options: mainBabelOptions
      }
    ])

  let webpackConfig = {
    context: dir,
    entry,
    output: {
      path: buildDir ? join(buildDir, '.nenv') : join(dir, config.distDir),
      filename: '[name]',
      publicPath: dev ? '/' : config.assetPublicPath,
      strictModuleExceptionHandling: true,
      devtoolModuleFilenameTemplate ({ resourcePath }) {
        const hash = createHash('sha1')
        hash.update(Date.now() + '')
        const id = hash.digest('hex').slice(0, 7)
        return `webpack:///${resourcePath}?${id}`
      },
      chunkFilename: '[name].js'
    },
    // 声明alias
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
        vue$: 'vue/dist/vue.esm.js',
        '@layouts': join(dir, 'layouts'),
        '@modules': join(dir, 'modules'),
        '@packages': join(dir, 'pakcages'),
        '@pages': join(dir, 'pages')
      },
      modules: [
        nenvNodeModulesDir,
        'node_modules',
        ...nodePathList
      ]
    },
    // 重新定向import/require 来源
    resolveLoader: {
      modules: [
        'node_modules',
        nenvNodeModulesDir,
        join(__dirname, 'loaders'),
        ...nodePathList
      ]
    },
    plugins,
    module: {
      rules
    },
    devtool: dev ? 'cheap-module-inline-source-map' : false,
    performance: { hints: false }
  }

  // 读取nenv.config.js内的webpack 配置
  if (config.webpack) {
    console.log(`> Using "webpack" config function defined in ${config.configOrigin}.`)
    webpackConfig = await config.webpack(webpackConfig, { dev }, webpack)
  }
  return webpack(webpackConfig)
}
