const path = require('path');
const packageJson = require('./../../package.json');
const rootDir = process.cwd();

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: process.platform === 'linux' ? packageJson.name : packageJson.productName,
    icon: path.join(rootDir, 'assets/build/icon'),
    appBundleId: packageJson.appId,
    // osxSign: {},
    // osxNotarize: {
    //   tool: 'notarytool',
    //   appleId: process.env.APPLE_ID,
    //   appleIdPassword: process.env.APPLE_ID_PASSWORD,
    //   teamId: process.env.APPLE_TEAM_ID,
    // },
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        overwrite: true,
        background: path.join(rootDir, 'assets/build/background-dmg.png'),
        icon: path.join(rootDir, 'assets/build/icon.icns'),
        additionalDMGOptions: {
          window: { size: { width: 660, height: 500 } }
        },
      }
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        setupIcon: path.join(rootDir, 'assets/build/icon.ico'),
        iconUrl: 'https://raw.githubusercontent.com/DmytroVasin/DrawPen/main/assets/build/icon.ico',
        loadingGif: path.join(rootDir, 'assets/build/loading.gif')
      }
    },
    {
      name: "@electron-forge/maker-deb",
      config: {}
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "linux", "win32"]
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        // Fix content-security-policy error when image or video src isn't same origin
        // Remove 'unsafe-eval' to get rid of console warning in development mode.
        devContentSecurityPolicy: `default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' data:`,
        port: 3000,
        loggerPort: 9000,
        mainConfig: path.join(rootDir, 'tools/webpack/webpack.main.js'),
        renderer: {
          config: path.join(rootDir, 'tools/webpack/webpack.renderer.js'),
          entryPoints: [
            {
              name: 'app_window',
              html: path.join(rootDir, 'src/renderer/app.html'),
              js: path.join(rootDir, 'src/renderer/index.js'),
              preload: {
                js: path.join(rootDir, 'src/renderer/preload.js'),
              },
            },
            {
              name: 'about_window',
              html: path.join(rootDir, 'src/renderer/about_page/about.html'),
              js: path.join(rootDir, 'src/renderer/about_page/about.js'),
              preload: {
                js: path.join(rootDir, 'src/renderer/about_page/preload.js'),
              },
            },
          ]
        },
        devServer: {
          liveReload: false,
        },
      }
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: packageJson.author.name,
          name: packageJson.productName,
        },
        draft: true
      }
    }
  ]
};
