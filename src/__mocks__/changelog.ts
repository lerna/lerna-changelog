import { Configuration } from "../configuration";

const Changelog = require.requireActual("../changelog").default;

const defaultConfig = {
  rootPath: "../",
  repo: "lerna/lerna-changelog",
  labels: {
    "Type: New Feature": ":rocket: New Feature",
    "Type: Breaking Change": ":boom: Breaking Change",
    "Type: Bug": ":bug: Bug Fix",
    "Type: Enhancement": ":nail_care: Enhancement",
    "Type: Documentation": ":memo: Documentation",
    "Type: Maintenance": ":house: Maintenance",
  },
  ignoreCommitters: [],
  cacheDir: ".changelog",
  nextVersion: "Unreleased",
};

class MockedChangelog extends Changelog {
  constructor(config: Partial<Configuration>) {
    super(Object.assign({}, defaultConfig, config));
  }

  private getToday() {
    return "2099-01-01";
  }
}

export default MockedChangelog;
