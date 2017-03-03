import os from "os";
import fs from "fs-extra";
import path from "path";

import { fromGitRoot, fromPath } from "../src/Configuration";
import ConfigurationError from "../src/ConfigurationError";

describe("Configuration", function() {
  describe("fromGitRoot", function() {
    it("reads the configuration from 'lerna.json'", function() {
      const rootPath = path.resolve(`${__dirname}/..`);
      const result = fromGitRoot(path.join(rootPath, "src"));
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

  describe("fromPath", function() {
    const tmpDir = `${os.tmpDir()}/changelog-test`;

    beforeEach(function() {
      fs.ensureDirSync(tmpDir);
    });

    afterEach(function() {
      fs.removeSync(tmpDir);
    });

    it("reads the configuration from 'lerna.json'", function() {
      fs.writeJsonSync(path.join(tmpDir, "lerna.json"), {
        changelog: { repo: "foo/bar" },
      });

      const result = fromPath(tmpDir);
      expect(result.repo).toEqual("foo/bar");
    });

    it("reads the configuration from 'package.json'", function() {
      fs.writeJsonSync(path.join(tmpDir, "package.json"), {
        changelog: { repo: "foo/bar" },
      });

      const result = fromPath(tmpDir);
      expect(result.repo).toEqual("foo/bar");
    });

    it("prefers 'package.json' over 'lerna.json'", function() {
      fs.writeJsonSync(path.join(tmpDir, "lerna.json"), {
        changelog: { repo: "foo/lerna" },
      });

      fs.writeJsonSync(path.join(tmpDir, "package.json"), {
        changelog: { repo: "foo/package" },
      });

      const result = fromPath(tmpDir);
      expect(result.repo).toEqual("foo/package");
    });

    it("throws ConfigurationError if neither 'package.json' nor 'lerna.json' exist", function() {
      expect(() => fromPath(tmpDir)).toThrowError(ConfigurationError);
    });
  });
});
