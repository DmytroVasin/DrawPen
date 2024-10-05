# Contributing

https://github.com/DmytroVasin/DrawPen

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Install the dependencies: `npm install`
3. Build the code, start the app, and watch for changes: `npm start`

To make sure that your code works in the finished app, you can generate the binary:

```
$ npm run package
```

After that, you'll see the binary in the `out` folder 😀

---

NOTE: The app creates a setting file to keep data between restarts, the path can be found here
```
# app.getPath('userData')
rm /Users/your_user_name/Library/Application\ Support/drawpen/config.json
```
