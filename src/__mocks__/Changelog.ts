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

let currentConfig = defaultConfig;
export function __resetDefaults() {
  currentConfig = defaultConfig;
}
export function __getConfig() {
  return currentConfig;
}
export function __setConfig(customConfig: any) {
  currentConfig = { ...defaultConfig, ...customConfig };
}

class MockedChangelog extends Changelog {
  getConfig() {
    return currentConfig;
  }
  getToday() {
    return "2099-01-01";
  }
}

export default MockedChangelog;
