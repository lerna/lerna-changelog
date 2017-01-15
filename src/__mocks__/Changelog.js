const Changelog = require.requireActual("../Changelog").default;

const defaultConfig = {
  rootPath: "../",
  repo: "lerna/lerna-changelog",
  labels: {
    "Type: New Feature": ":rocket: New Feature",
    "Type: Breaking Change": ":boom: Breaking Change",
    "Type: Bug": ":bug: Bug Fix",
    "Type: Enhancement": ":nail_care: Enhancement",
    "Type: Documentation": ":memo: Documentation",
    "Type: Maintenance": ":house: Maintenance"
  },
  cacheDir: ".changelog"
};
const defaultListOfUniquePackages = [ "pkg-1", "pkg-2" ];
const defaultListOfCommits = [
  "a0000005;HEAD -> master, tag: v0.2.0, origin/master, origin/HEAD;chore(release): releasing component;2017-01-01",
  "a0000004;;Merge pull request #2 from my-feature;2017-01-01",
  "a0000003;;feat(module) Add new module (#2);2017-01-01",
  "a0000002;;refactor(module) Simplify implementation;2017-01-01",
  "a0000001;tag: v0.1.0;chore(release): releasing component;2017-01-01"
];

let currentConfig = defaultConfig;
let currentListOfCommits = defaultListOfCommits;

export function __resetDefaults() {
  currentConfig = defaultConfig;
  currentListOfCommits = defaultListOfCommits;
}

export function __getConfig() {
  return currentConfig;
}
export function __setConfig(customConfig) {
  currentConfig = { ...defaultConfig, ...customConfig };
}
export function __prependListOfCommits(customListOfCommits) {
  currentListOfCommits = [ ...customListOfCommits, ...defaultListOfCommits ];
}

class MockedChangelog extends Changelog {
  getConfig() {
    return currentConfig;
  }
  getListOfUniquePackages() {
    return defaultListOfUniquePackages;
  }
  getListOfCommits() {
    return currentListOfCommits;
  }
}

export default MockedChangelog;
