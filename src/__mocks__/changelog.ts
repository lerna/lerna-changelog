import { Configuration } from "../configuration";
import MockedGithubAPI from "./git-hosting-api/github-api";

const Changelog = jest.requireActual("../changelog").default;
const rootPath = "../";
const repo = "lerna/lerna-changelog";
const cacheDir = ".changelog";

const defaultConfig = {
  rootPath,
  repo,
  labels: {
    "Type: New Feature": ":rocket: New Feature",
    "Type: Breaking Change": ":boom: Breaking Change",
    "Type: Bug": ":bug: Bug Fix",
    "Type: Enhancement": ":nail_care: Enhancement",
    "Type: Documentation": ":memo: Documentation",
    "Type: Maintenance": ":house: Maintenance",
  },
  ignoreCommitters: [],
  cacheDir,
  nextVersion: "Unreleased",
  gitHostingAPI: new MockedGithubAPI({
    repo,
    rootPath,
    cacheDir,
    gitHostingServerURL: "",
  }),
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
