<p align="center">
  <img src="https://github.com/DmytroVasin/DrawPen/blob/main/assets/static/icon.png?raw=true" height="200">
  <h3 align="center">Draw Pen</h3>
  <p align="center">An open-source screen annotation tool<p>
</p>

<p align="center">
  <a href='https://github.com/DmytroVasin/DrawPen/releases/latest/download/DrawPen.Setup.exe'>
    <img alt='Get it on Windows' width="134px" src='https://github.com/DmytroVasin/DrawPen/blob/main/assets/static/BadgeWindows.png?raw=true'/>
  </a>
  <a href='https://github.com/DmytroVasin/DrawPen/releases/latest/download/DrawPen-0.0.42-arm64.dmg'>
    <img alt='Get it on macOS' width="134px" src='https://github.com/DmytroVasin/DrawPen/blob/main/assets/static/BadgeMacOS.png?raw=true'/>
  </a>
  <a href='https://github.com/DmytroVasin/DrawPen/releases/latest/download/drawpen_0.0.42_amd64.deb'>
    <img alt='Get it on Linux' width="134px" src='https://github.com/DmytroVasin/DrawPen/blob/main/assets/static/BadgeLinux.png?raw=true'/>
  </a>
</p>

---

![DrawPen](https://github.com/DmytroVasin/DrawPen/blob/main/assets/static/main.png?raw=true)

![DrawPen - Usage](https://github.com/DmytroVasin/DrawPen/blob/main/assets/static/main.gif?raw=true)

### Installation

You can download DrawPen for **free** from [releases](https://github.com/DmytroVasin/DrawPen/releases)

Or install via **package managers**:

```bash
# macOS (Homebrew)
brew install --cask drawpen

# Windows (Scoop)
scoop bucket add extras
scoop install extras/drawpen
```

### Known issues

On some Linux setups running **Wayland** (e.g. [Fedora KDE Plasma](https://github.com/DmytroVasin/DrawPen/issues/82), [Zorin](https://github.com/DmytroVasin/DrawPen/issues/81)), DrawPen may start with a **segmentation fault**. [Explanation In Details](https://github.com/IsmaelMartinez/teams-for-linux/blob/1c28e146ca78bcb0ec4df317d7f0684984adf205/docs-site/docs/development/research/wayland-x11-ozone-platform-investigation.md)

#### Workaround:

- Run DrawPen with X11 backend: `drawpen --ozone-platform=x11`
- Use DrawPen `drawpen-x11` package available in [releases](https://github.com/DmytroVasin/DrawPen/releases/latest/)

### Keybindings

| Command                                 | Keybindings                                                  | Comment |
| --------------------------------------- | ------------------------------------------------------------ | - |
| Show/Hide App                           | <kbd>CMD/CTRL + SHIFT + A</kbd> | Global shortcut |
| Activate Pen                            | <kbd>1</kbd> | |
| Activate/Switch Shapes (Arrow/Square/etc.)   | <kbd>2</kbd> | |
| Activate Text                           | <kbd>3</kbd> | |
| Activate Highlighter                    | <kbd>4</kbd> | |
| Activate Laser                          | <kbd>5</kbd> | |
| Activate Eraser                         | <kbd>6</kbd> | |
| Switch Color                            | <kbd>7</kbd> | |
| Switch Thickness (Width)                | <kbd>8</kbd> | |
| Show/Hide ToolBar                       | <kbd>CMD/CTRL + T</kbd> | |
| Show/Hide Whiteboard                    | <kbd>CMD/CTRL + E</kbd> | |
| Clear Desk                              | <kbd>CMD/CTRL + K</kbd> | |
| Settings Page                           | <kbd>CMD/CTRL + ,</kbd> | |
| Reset to original                       | | Resets all app settings <br /> (keys, colors, toolbar position, etc.)  |

### Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for more information.

### License

DrawPen is licensed under the MIT Open Source license.
For more information, see [LICENSE](LICENSE).
