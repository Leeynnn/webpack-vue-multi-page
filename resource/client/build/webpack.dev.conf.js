'use strict'
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const portfinder = require('portfinder')
const express = require('express')
const url = require('url')
const app = express()

const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)

let devWebpackConfigObj = {
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
  },
  // cheap-module-eval-source-map is faster for development
  devtool: config.dev.devtool,

  // these devServer options should be customized in /config/index.js
  devServer: {
    clientLogLevel: 'warning',
    historyApiFallback: {
      rewrites: [
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') },
      ],
    },
    hot: true,
    contentBase: false, // since we use CopyWebpackPlugin.
    compress: true,
    host: HOST || config.dev.host,
    port: PORT || config.dev.port,
    open: config.dev.autoOpenBrowser,
    overlay: config.dev.errorOverlay
      ? { warnings: false, errors: true }
      : false,
    publicPath: config.dev.assetsPublicPath,
    proxy: config.dev.proxyTable,
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: {
      poll: config.dev.poll,
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': require('../config/dev.env')
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    new webpack.NoEmitOnErrorsPlugin(),
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.dev.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
}

const entriesObj = config.getView('./src/entries/*')
// 为每个页面生成对应的html文件
Object.keys(entriesObj).forEach(pathname => {
  let htmlname = pathname
  let conf = {
    filename: `../dist/${htmlname}.html`,
    template: `./src/entries/${htmlname}/index.html`,
    hash: true,
    // chunks: [htmlname],
    chunks: ['manifest', 'vendor', htmlname],
    inject: true,
    minify: {
      removeAttributeQuotes: true,
      removeComments: true,
      collapseWhitespace: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    }
  }

  devWebpackConfigObj.plugins.push(new HtmlWebpackPlugin(conf))
})

const devWebpackConfig = merge(baseWebpackConfig, devWebpackConfigObj)

// 以下是核心
devWebpackConfig.output.path = path.resolve(__dirname, '../dist')

const compiler = webpack(devWebpackConfig)
const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: devWebpackConfig.output.publicPath,
  stats: {
    colors: true,
    chunks: false
  }
})

app.use(devMiddleware)

app.get('*', function (req, res, next) {
  let pathname = url.parse(req.url).pathname
  if (pathname !== '/favicon.ico') {
    let viewname = pathname + '.html'
    let filepath = path.join(compiler.outputPath, viewname)
    // 使用webpack提供的outputFileSystem
    compiler.outputFileSystem.readFile(filepath, function (err, result) {
        if (err) {
            // something error
            return next(err)
        }
        res.set('content-type', 'text/html')
        res.send(result)
        res.end()
    })
  }
})

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port
      // add port to devServer config
      devWebpackConfig.devServer.port = port

      // Add FriendlyErrorsPlugin
      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`],
        },
        onErrors: config.dev.notifyOnErrors
        ? utils.createNotifierCallback()
        : undefined
      }))
      app.listen(port, function (err) {
        if (err) {
            // do something
            return
        }
        console.log('Listening at http://localhost:' + port + '\n')
      })
      // resolve(devWebpackConfig)
    }
  })
})
