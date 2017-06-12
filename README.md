# Lerna Changelog

Generate a changelog for a [lerna][lerna-homepage] monorepo.

Based on [@hzoo][hzoo-profile]'s long-lived [PR][original-pr] for `lerna changelog`.

Uses github PR/Issue names categorized by labels with configurable headings.

## Usage

Install:

```bash
$ npm install -g lerna-changelog
```

Configure:

```diff
$ git diff lerna.json
...
 {
+  "changelog": {
+    "repo": "my-org/my-repo",
+    "labels": {
+      "bug": "Bug fix",
+      "cleanup": "Housekeeping"
+    },
+    "cacheDir": ".changelog"
+  },
   "lerna": "2.0.0-beta.9",
   "version": "0.2.11"
 }
```

Authenticate:

```
$ export GITHUB_AUTH="..."
```

You'll need a GitHub API [personal access token](https://github.com/settings/tokens) with the `repo` scope for private repositories or just `public_repo` scope for public repositories.

Run:

```bash
$ lerna-changelog

## Unreleased (2016-05-24)

#### Bug fix
* `my-package-a`, `my-package-b`
  * [#198](https://github.com/my-org/my-repo/pull/198) Avoid an infinite loop. ([@helpful-hacker](https://github.com/helpful-hacker))

#### Housekeeping
* `my-package-c`
  * [#183](https://github.com/my-org/my-repo/pull/183) Standardize error messages. ([@careful-coder](https://github.com/careful-coder))

#### Commiters: 2
- helpful-hacker
- careful-coder

```

Copypasta.  You're done!

## Configuration

- `repo`: Your "org/repo" on GitHub
- `cacheDir` [optional]: A place to stash GitHub API responses to avoid throttling
- `labels`: GitHub issue/PR labels mapped to changelog section headers
- `ignoreCommitters` [optional]: list of commiters to ignore (exact or partial match). Useful for example to ignore commits from bot agents

## CLI

```bash
$ lerna-changelog
Usage: lerna-changelog [options]

Options:
  --tag-from  A git tag that determines the lower bound of the range of commits
              (defaults to last available)                              [string]
  --tag-to    A git tag that determines the upper bound of the range of commits
                                                                        [string]
  --version   Show version number                                      [boolean]
  --help      Show help                                                [boolean]

Examples:
  lerna-changelog                           create a changelog for the changes
                                            after the latest available tag
  lerna-changelog --tag-from 0.1.0          create a changelog for the changes
  --tag-to 0.3.0                            in all tags within the given range
```

[lerna-homepage]: https://lernajs.io
[hzoo-profile]: https://github.com/hzoo
[original-pr]: https://github.com/lerna/lerna/pull/29
