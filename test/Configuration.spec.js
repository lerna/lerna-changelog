import path from "path";
import { fromCWD } from "../src/Configuration";

describe("Configuration", function() {
  describe("fromCWD", function() {
    it("reads the configuration from 'lerna.json'", function() {
      const result = fromCWD();
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
        "rootPath": path.resolve(`${__dirname}/..`),
      });
    });
  });
});
