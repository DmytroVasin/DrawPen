const path = require('path');
const packageJson = require('./../../package.json');
const rootDir = process.cwd();

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'DrawPen',
    icon: path.join(rootDir, 'assets/icon'),
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
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',  // Maker для Mac
      config: {
        background: path.join(rootDir, 'assets/background-dmg.png'),
        icon: path.join(rootDir, 'assets/icon.icns'),
        additionalDMGOptions: {
          window: { size: { width: 660, height: 500 } }
        },
      }
    },
    // {
    //   name: "@electron-forge/maker-squirrel",  // Maker для Windows (squirrel)
    //   config: {}
    // },
    // {
    //   name: "@electron-forge/maker-zip",  // Maker для создания zip-архива (включая macOS)
    //   platforms: ["darwin", "linux"]
    // },
    // {
    //   name: "@electron-forge/maker-deb",  // Maker для Linux (deb)
    //   config: {}
    // },
    // {
    //   name: "@electron-forge/maker-rpm",  // Maker для Linux (rpm)
    //   config: {}
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
