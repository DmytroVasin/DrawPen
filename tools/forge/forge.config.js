const path = require('path');
const packageJson = require('./../../package.json');
const rootDir = process.cwd();

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: process.platform === 'linux' ? packageJson.name : packageJson.productName,
    icon: path.join(rootDir, 'assets/build/icon'),
    // osxSign: {
    //   identity: 'Developer ID Application: Your Name (TeamID)', // Ваша цифровая подпись Apple Developer
    //   hardenedRuntime: true, // Включает защищённую среду исполнения (требуется для некоторых API)
    //   entitlements: 'path/to/entitlements.plist', // Путь к файлу с разрешениями (опционально)
    //   'entitlements-inherit': 'path/to/entitlements.plist', // Права наследования для дочерних процессов (опционально)
    //   'gatekeeper-assess': false, // Проверка с помощью Gatekeeper (по умолчанию false)
    // },
    // osxNotarize: {
    //   appBundleId: 'com.example.app', // Bundle ID вашего приложения
    //   appleId: 'your-apple-id@example.com', // Apple ID разработчика
    //   appleIdPassword: 'your-app-specific-password', // Пароль для входа (используйте App-Specific Password)
    // }
    // osxSign: {},
    // osxNotarize: {
    //   tool: 'notarytool',
    //   appleId: process.env.APPLE_ID,
    //   appleIdPassword: process.env.APPLE_PASSWORD,
    //   teamId: process.env.APPLE_TEAM_ID,
    // },
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',  // Maker for Mac
      config: {
        background: path.join(rootDir, 'assets/build/background-dmg.png'),
        icon: path.join(rootDir, 'assets/build/icon.icns'),
        additionalDMGOptions: {
          window: { size: { width: 660, height: 500 } }
        },
      }
    },
    {
      name: "@electron-forge/maker-squirrel",  // Maker for Windows (squirrel)
      config: {
        // iconUrl: 'https://github.com/chaiNNer-org/chaiNNer/blob/main/src/public/icons/win/icon.ico',
        // setupIcon: './src/public/icons/win/icon.ico',
        // loadingGif: './src/public/icons/win/installing_loop.gif',
      }
    },
    {
      name: "@electron-forge/maker-deb",  // Maker for Linux (deb)
      config: {}
    },
    {
      name: "@electron-forge/maker-rpm",  // Maker for Linux (rpm)
      config: {}
    },
    // {
    //   name: "@electron-forge/maker-zip",
    //   platforms: ["darwin", "linux", "windows"]
    // }
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
        prerelease: false,
        draft: true
      }
    }
  ]
};
