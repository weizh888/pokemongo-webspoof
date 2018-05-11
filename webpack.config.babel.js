import webpack from 'webpack'

const path = require('path');

module.exports = (env, argv) => ({
  entry: [
    'babel-polyfill',
    './src/index.js'
  ],

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: 'index.js',
    chunkFilename: '[name].js'
  },

  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      { test: /\.css$/, use: [
                              { loader: 'style-loader' },
                              { loader: 'css-loader' },
                              { loader: 'postcss-loader', options: {
                                  plugins: (loader) => [
                                                        require('postcss-import'),
                                                        require('precss'),
                                                      ]
                              } } ] },
      { test: /\.json$/, loader: 'json' }
    ]
  },

  optimization: {
    minimize: argv.mode === 'production'
  },

  performance: {
    maxEntrypointSize: argv.mode === 'production' ? 670000 : 1340000, /* default 250000 */
    maxAssetSize: argv.mode === 'production' ? 670000 : 1340000       /* default 250000 */
  }

})
