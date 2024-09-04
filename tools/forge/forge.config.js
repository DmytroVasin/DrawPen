const path = require('path');
const rootDir = process.cwd();

module.exports = {
  packagerConfig: {
    // Create asar archive for main, renderer process files
    asar: true,
    // Set executable name
    executableName: 'DrawPen',
    // Set application icon
    icon: path.resolve('assets/images/appIcon.ico'),
    //
    // osxSign: {},
    // // ...
    // osxNotarize: {
    //   tool: 'notarytool',
    //   appleId: process.env.APPLE_ID,
    //   appleIdPassword: process.env.APPLE_PASSWORD,
    //   teamId: process.env.APPLE_TEAM_ID
    // }
  },
  makers: [
    {
      // The Zip target builds basic .zip files containing your packaged application.
      // There are no platform specific dependencies for using this maker and it will run on any platform.
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        // Fix content-security-policy error when image or video src isn't same origin
        // Remove 'unsafe-eval' to get rid of console warning in development mode.
        devContentSecurityPolicy: `default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' data:`,
        // Ports
        port: 3000, // Webpack Dev Server port
        loggerPort: 9000, // Logger port
        // Main process webpack configuration
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
          owner: 'DmytroVasin',
          name: 'DrawPen'
        },
        prerelease: false,
        draft: true
      }
    }
  ]
};
