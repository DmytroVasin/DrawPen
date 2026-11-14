## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Install the dependencies: `npm install`
3. Build the code, start the app, and watch for changes: `npm start`

To make sure that your code works in the finished app, you can generate the binary:

```
$ npm run package
```

After that, you'll see the binary in the `out` folder 😀

## Debug logging

To enable development-level logs in a packaged app, quit any running DrawPen instance and launch it from a terminal with `DRAWPEN_DEBUG=1`:

```bash
# macOS
DRAWPEN_DEBUG=1 /Applications/DrawPen.app/Contents/MacOS/DrawPen

# Linux
DRAWPEN_DEBUG=1 drawpen
```

This flag only enables additional logging; it does not change the app layout or enable other development-only behavior.


## Local settings

The app stores its settings between restarts in the file. To reset the settings on macOS, quit DrawPen and delete its configuration file:

```bash
# app.getPath('userData')
rm /Users/your_user_name/Library/Application\ Support/drawpen/config.json
```

## Mac App (MAS)

Mac App Store builds store a security-scoped bookmark alongside a screenshot folder selected in Settings.

The MAS signing configuration must enable these file-access entitlements:

- `com.apple.security.assets.pictures.read-write` for the default `Pictures/drawpen` folder.
- `com.apple.security.files.user-selected.read-write` for folders selected in Settings.
- `com.apple.security.files.bookmarks.app-scope` to restore access after restarting DrawPen.
