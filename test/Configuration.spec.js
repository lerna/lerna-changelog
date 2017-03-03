import path from "path";
import { fromGitRoot } from "../src/Configuration";

describe("Configuration", function() {
  describe("fromGitRoot", function() {
    it("reads the configuration from 'lerna.json'", function() {
      const rootPath = path.resolve(`${__dirname}/..`);
      const result = fromGitRoot(rootPath);
      expect(result).toEqual({
        "repo": "lerna/lerna-changelog",
        "labels": {
          "Tag: Breaking Change": ":boom: Breaking Change",
          "Tag: Enhancement": ":rocket: Enhancement",
          "Tag: Bug Fix": ":bug: Bug Fix",
          "Tag: Polish": ":nail_care: Polish",
          "Tag: Documentation": ":memo: Documentation",
          "Tag: Internal": ":house: Internal"
        },
        "cacheDir": ".changelog",
        rootPath,
      });
    });
  });
});
