require('dotenv').config();

const fs = require('fs');
const path = require('path');
const packageJson = require('./../../package.json');
const rootDir = process.cwd();

const linuxIconPng = path.join(rootDir, 'assets/build/icon_512.png');

// koffi is a native addon kept out of the webpack bundle (externals in
// tools/webpack/main.js). The webpack plugin packages only `.webpack/`, so we
// must copy koffi into the packaged app's node_modules ourselves and unpack its
// prebuilt `.node` binary from the asar so it can be loaded at runtime.
module.exports = {
  packagerConfig: {
    asar: {
      // koffi's JS loader + its platform binary package (@koromix/koffi-*) both
      // need to be real files on disk (the .node can't be loaded from inside an
      // asar), so unpack them.
      unpack: '**/node_modules/{koffi,@koromix}/**',
    },
    executableName: process.platform === 'linux' ? packageJson.name : packageJson.productName,
    icon: path.join(rootDir, 'assets/build/icon'),
    appBundleId: packageJson.appId,
    ...(process.argv.includes('--no-sign')
      ? {}
      : {
        osxSign: {},
        osxNotarize: {
          tool: 'notarytool',
          appleId: process.env.APPLE_ID,
          appleIdPassword: process.env.APPLE_PASSWORD,
          teamId: process.env.APPLE_TEAM_ID,
        },
      }),
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
  hooks: {
    // Copy the koffi native module into the packaged app's node_modules so the
    // webpack-externalized `require('koffi')` resolves in built installers.
    // (forge-externals-plugin can't be used: it fails to resolve koffi's
    // package.json because koffi restricts its "exports" field.)
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      // koffi 3.x ships its native binary in a separate, platform-specific
      // package (@koromix/koffi-<platform>-<arch>) that koffi requires at
      // runtime. Copy koffi AND the whole @koromix scope so the binary is present.
      const copyModule = async (relName) => {
        const src = path.join(rootDir, 'node_modules', relName);
        if (!fs.existsSync(src)) return;
        const dest = path.join(buildPath, 'node_modules', relName);
        await fs.promises.cp(src, dest, { recursive: true });
      };

      await copyModule('koffi');
      await copyModule('@koromix');
    },
  },
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
