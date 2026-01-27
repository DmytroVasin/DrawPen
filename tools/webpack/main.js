const webpack = require('webpack');

module.exports = {
  entry: './src/main/index.js',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PUBLIC_POSTHOG_KEY': JSON.stringify(process.env.PUBLIC_POSTHOG_KEY),
    }),
  ],
};
