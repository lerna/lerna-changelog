## v0.5.0 (2017-05-31)

- Make lerna-changelog work better for a regular repo (including this one)

#### :rocket: Enhancement
* [#51](https://github.com/lerna/lerna-changelog/pull/51) Use async/await to request commit infos concurrently. ([@Turbo87](https://github.com/Turbo87))

#### :bug: Bug Fix
* [#53](https://github.com/lerna/lerna-changelog/pull/53) Skip package heading for single package repos. ([@Turbo87](https://github.com/Turbo87))

#### :house: Internal
* [#49](https://github.com/lerna/lerna-changelog/pull/49) Exclude arrow functions, classes and generator functions from being transpiled. ([@Turbo87](https://github.com/Turbo87))
* [#50](https://github.com/lerna/lerna-changelog/pull/50) Update "jest" to v20.0.4. ([@Turbo87](https://github.com/Turbo87))
* [#48](https://github.com/lerna/lerna-changelog/pull/48) Adjust "lint" script. ([@Turbo87](https://github.com/Turbo87))
* [#47](https://github.com/lerna/lerna-changelog/pull/47) Move configuration from "lerna.json" into "package.json". ([@Turbo87](https://github.com/Turbo87))

#### Committers: 1
- Tobias Bieniek ([Turbo87](https://github.com/Turbo87))

## v0.4.0 (2017-03-24)

Notable changes:

- We dropped Node 0.10/0.12
- Adds support for the "changelog" config key from "package.json" instead of from "lerna.json"
- Removes "lerna" peerDep

> Basically removes ties to lerna so can be used standalone.

#### :boom: Breaking Change
* Other
  * [#37](https://github.com/lerna/lerna-changelog/pull/37) Babel: Use "preset-env" instead of "preset-es2015". ([@Turbo87](https://github.com/Turbo87))

#### :rocket: Enhancement
* Other
  * [#42](https://github.com/lerna/lerna-changelog/pull/42) Read "changelog" config key from "package.json" too. ([@Turbo87](https://github.com/Turbo87))

#### :house: Internal
* Other
  * [#41](https://github.com/lerna/lerna-changelog/pull/41) Remove "lerna" peer dependency. ([@Turbo87](https://github.com/Turbo87))
  * [#39](https://github.com/lerna/lerna-changelog/pull/39) Update .gitignore file. ([@Turbo87](https://github.com/Turbo87))
  * [#40](https://github.com/lerna/lerna-changelog/pull/40) package.json: Sort keys according to documentation. ([@Turbo87](https://github.com/Turbo87))
  * [#38](https://github.com/lerna/lerna-changelog/pull/38) Apply ESLint to "test" folder too. ([@Turbo87](https://github.com/Turbo87))

#### Committers: 1
- Tobias Bieniek ([Turbo87](https://github.com/Turbo87))

## v0.3.0 (2017-01-29)

#### :rocket: Enhancement
* [#31](https://github.com/lerna/lerna-changelog/pull/31) New CLI options, custom tags range and tests.. ([@emmenko](https://github.com/emmenko))

#### :house: Internal
* [#33](https://github.com/lerna/lerna-changelog/pull/33) add yarn.lock. ([@hzoo](https://github.com/hzoo))
* [#32](https://github.com/lerna/lerna-changelog/pull/32) Add changelog file, move cli to /bin. ([@hzoo](https://github.com/hzoo))

#### Committers: 2
- Henry Zhu ([hzoo](https://github.com/hzoo))
- Nicola Molinari ([emmenko](https://github.com/emmenko))

## v0.2.3 (2016-11-27)

#### :bug: Bug Fix
* Other
  * [#28](https://github.com/lerna/lerna-changelog/pull/28) Convert label name to lowercase before matching. ([@fson](https://github.com/fson))

#### Committers: 1
- Ville Immonen ([fson](https://github.com/fson))

## v0.2.2 (2016-10-24)

#### :bug: Bug Fix
* [#27](https://github.com/lerna/lerna-changelog/pull/27) match other closes keywords for github - Closes [#7](https://github.com/lerna/lerna-changelog/issues/7). ([@hzoo](https://github.com/hzoo))

#### Committers: 1
- Henry Zhu ([hzoo](https://github.com/hzoo))

## v0.2.1 (2016-07-29)

#### :bug: Bug Fix
* [#24](https://github.com/lerna/lerna-changelog/pull/24) If there is no name, just print the username. ([@hzoo](https://github.com/hzoo))

#### Committers: 1
- Henry Zhu ([hzoo](https://github.com/hzoo))

## v0.2.0 (2016-06-17)

#### :rocket: Enhancement
* [#18](https://github.com/lerna/lerna-changelog/pull/18) Consolidate changes by affected packages. ([@gigabo](https://github.com/gigabo))

#### :bug: Bug Fix
* [#13](https://github.com/lerna/lerna-changelog/pull/13) Remove the `--first-parent` option from log list generation. ([@gigabo](https://github.com/gigabo))
* [#20](https://github.com/lerna/lerna-changelog/pull/20) Nicer error message on missing config. ([@gigabo](https://github.com/gigabo))
* [#14](https://github.com/lerna/lerna-changelog/pull/14) Update repository URLs in package.json. ([@gigabo](https://github.com/gigabo))

#### Committers: 1
- Bo Borgerson ([gigabo](https://github.com/gigabo))
