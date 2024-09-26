const webpack = require('webpack');
const { inDev } = require('./webpack.helpers');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

const copyPlugins = [
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve('assets/web'),
        to: path.resolve('.webpack/renderer/web'),
      }
    ]
  })
]

module.exports = [
  inDev() && new webpack.HotModuleReplacementPlugin(),
  ...copyPlugins,
].filter(Boolean);
