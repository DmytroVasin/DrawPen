const webpack = require('webpack');
const { inDev } = require('./webpack.helpers');

module.exports = [
  inDev() && new webpack.HotModuleReplacementPlugin(),
].filter(Boolean);
