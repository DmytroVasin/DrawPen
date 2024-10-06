## Release Process

### 1. Create a new version

- Write the changelog

  You can use `git log --oneline <last version tag>..HEAD` to get a list of changes.

  Summarize them concisely in `CHANGELOG.md`. The commit  message should be "[CHANGELOG]".

- Update the version

  ```
  npm version [major|minor|patch]
  ```

  This updates package.json and creates commits, git tag.

- Push commit and tags to remote repo:
  ```
  git push --follow-tags
  ```


### 2. Check it

- Make sure that Release was created successfully (Draft)
- Make sure that Tag was created successfully


### 3. Ship It

- Add changes to Draft Release
- Mark Release as "Published"


### 4. Debug/Rollback:

- Check all tags:

  ```
  git tag
  ```

- Remove tag from local machine:

  ```
  git tag -d v0.0.2
  ```

- Remove tag from remote repo:

  ```
  git push origin --delete v0.0.2
  ```

- Check project make and release (on local machine):

  ```
  npm run make
  GH_TOKEN=gh_token npm run publish
  ```

  NOTE: You need to have proper token:
  https://github.com/settings/tokens
