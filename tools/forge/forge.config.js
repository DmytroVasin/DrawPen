require('dotenv').config();

const path = require('path');
const packageJson = require('./../../package.json');
const rootDir = process.cwd();
const isMasBuild = process.argv.includes('--platform=mas');
const isSigningEnabled = !process.argv.includes('--no-sign');
const masProvisioningProfile = process.env.APPLE_MAS_PROVISIONING_PROFILE;

if (isMasBuild && !masProvisioningProfile) {
  throw new Error('Set APPLE_MAS_PROVISIONING_PROFILE to your development provisioning profile path.');
}

const linuxIconPng = path.join(rootDir, 'assets/build/icon_512.png');

const signingConfig = isMasBuild
  ? {
    osxSign: {
      identity: 'Apple Development',
      type: 'development',
      provisioningProfile: masProvisioningProfile,
      continueOnError: false,
      optionsForFile: (filePath) => ({
        entitlements: path.join(__dirname, filePath.includes('.app/')
          ? 'entitlements.mas.inherit.plist'
          : 'entitlements.mas.plist'),
        hardenedRuntime: false,
      }),
    },
  }
  : {
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
  };

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: process.platform === 'linux' ? packageJson.name : packageJson.productName,
    icon: path.join(rootDir, 'assets/build/icon'),
    appBundleId: packageJson.appId,
    ...(isSigningEnabled ? signingConfig : {}),
  },
  makers: isMasBuild ? [] : [
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
        loadingGif: path.join(rootDir, 'assets/build/loading.gif'),
        name: 'DrawPen',
        shortcutName: 'DrawPen',
        setupExe: 'DrawPen.Setup.exe',
        noMsi: true
      }
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: linuxIconPng,
          categories: ['Graphics', 'Utility'],
          maintainer: "Dmytro Vasin",
          homepage: 'https://drawpen.app'
        }
      }
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          icon: linuxIconPng,
          categories: ['Graphics', 'Utility'],
          homepage: 'https://drawpen.app'
        }
      }
    },
    {
      // Second RPM: forces X11 via Exec args in generated .desktop
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          name: "drawpen-x11",
          productName: "DrawPen (X11)",
          icon: linuxIconPng,
          categories: ['Graphics', 'Utility'],
          homepage: 'https://drawpen.app',
          execArguments: ['--ozone-platform=x11'],
        }
      }
    },
    {
      // Second DEB: forces X11 via custom .desktop template
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          name: "drawpen-x11",
          productName: "DrawPen (X11)",
          icon: linuxIconPng,
          categories: ['Graphics', 'Utility'],
          maintainer: "Dmytro Vasin",
          homepage: 'https://drawpen.app',
          desktopTemplate: path.join(rootDir, 'assets/build/desktop-x11.desktop.ejs'),
        }
      }
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
        devContentSecurityPolicy: `default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' data:`,
        mainConfig: path.join(rootDir, 'tools/webpack/main.js'),
        renderer: {
          config: path.join(rootDir, 'tools/webpack/renderer.js'),
          entryPoints: [
            {
              name: 'app_window',
              html: path.join(rootDir, 'src/renderer/app_page/index.html'),
              js: path.join(rootDir, 'src/renderer/app_page/index.js'),
              preload: {
                js: path.join(rootDir, 'src/renderer/app_page/preload.js'),
              },
            },
            {
              name: 'extended_toolbar_window',
              html: path.join(rootDir, 'src/renderer/extended_toolbar_page/index.html'),
              js: path.join(rootDir, 'src/renderer/extended_toolbar_page/index.js'),
              preload: {
                js: path.join(rootDir, 'src/renderer/extended_toolbar_page/preload.js'),
              },
            },
            {
              name: 'about_window',
              html: path.join(rootDir, 'src/renderer/about_page/index.html'),
              js: path.join(rootDir, 'src/renderer/about_page/index.js'),
              preload: {
                js: path.join(rootDir, 'src/renderer/about_page/preload.js'),
              },
            },
            {
              name: 'settings_window',
              html: path.join(rootDir, 'src/renderer/settings_page/index.html'),
              js: path.join(rootDir, 'src/renderer/settings_page/index.js'),
              preload: {
                js: path.join(rootDir, 'src/renderer/settings_page/preload.js'),
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
  publishers: isMasBuild ? [] : [
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
