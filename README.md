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

[lerna-homepage]: https://lernajs.io
[hzoo-profile]: https://github.com/hzoo
[original-pr]: https://github.com/lerna/lerna/pull/29
