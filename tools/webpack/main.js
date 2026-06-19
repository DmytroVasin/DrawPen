const webpack = require('webpack');

module.exports = {
  entry: './src/main/index.js',
  // koffi is a native addon (loads a prebuilt .node at runtime). It must NOT be
  // bundled by webpack — keep it as a runtime require resolved from node_modules.
  // For packaged builds, @timfish/forge-externals-plugin (see forge.config.js)
  // copies it into the app and unpacks it from the asar.
  externals: {
    koffi: 'commonjs2 koffi',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PUBLIC_POSTHOG_KEY': JSON.stringify(process.env.PUBLIC_POSTHOG_KEY),
    }),
  ],
};
