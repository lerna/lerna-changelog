const os = require("os");
const fs = require("fs-extra");
const path = require("path");

import { findRepoFromPkg, fromPath } from "./configuration";
import ConfigurationError from "./configuration-error";

describe("Configuration", function() {
  describe("fromPath", function() {
    const tmpDir = `${os.tmpdir()}/changelog-test`;

    beforeEach(function() {
      fs.ensureDirSync(tmpDir);
    });

    afterEach(function() {
      fs.removeSync(tmpDir);
    });

    it("reads the configuration from 'lerna.json'", function() {
      fs.writeJsonSync(path.join(tmpDir, "lerna.json"), {
        changelog: { repo: "foo/bar", nextVersion: "next" },
      });

      const result = fromPath(tmpDir);
      expect(result.nextVersion).toEqual("next");
      expect(result.repo).toEqual("foo/bar");
    });

    it("reads the configuration from 'package.json'", function() {
      fs.writeJsonSync(path.join(tmpDir, "package.json"), {
        changelog: { repo: "foo/bar", nextVersion: "next" },
      });

      const result = fromPath(tmpDir);
      expect(result.nextVersion).toEqual("next");
      expect(result.repo).toEqual("foo/bar");
    });

    it("prefers 'package.json' over 'lerna.json'", function() {
      fs.writeJsonSync(path.join(tmpDir, "lerna.json"), {
        version: "1.0.0-lerna.0",
        changelog: { repo: "foo/lerna", nextVersionFromMetadata: true },
      });

      fs.writeJsonSync(path.join(tmpDir, "package.json"), {
        version: "1.0.0-package.0",
        changelog: { repo: "foo/package", nextVersionFromMetadata: true },
      });

      const result = fromPath(tmpDir);
      expect(result.nextVersion).toEqual("v1.0.0-package.0");
      expect(result.repo).toEqual("foo/package");
    });

    it("throws ConfigurationError if neither 'package.json' nor 'lerna.json' exist", function() {
      expect(() => fromPath(tmpDir)).toThrowError(ConfigurationError);
    });
  });

  describe("findRepoFromPkg", function() {
    const tests = [
      ["git+https://github.com/ember-cli/ember-rfc176-data.git", "ember-cli/ember-rfc176-data"],
      ["https://github.com/ember-cli/ember-rfc176-data.git", "ember-cli/ember-rfc176-data"],
      ["https://github.com/babel/ember-cli-babel", "babel/ember-cli-babel"],
      ["https://github.com/babel/ember-cli-babel.git", "babel/ember-cli-babel"],
      ["git@github.com:babel/ember-cli-babel.git", "babel/ember-cli-babel"],
      ["https://github.com/emberjs/ember.js.git", "emberjs/ember.js"],
      ["https://gitlab.com/gnachman/iterm2.git", undefined],
      ["git@gitlab.com:gnachman/iterm2.git", undefined],
    ];

    tests.forEach(([input, output]) => {
      it(`'${input}' -> '${output}'`, function() {
        expect(
          findRepoFromPkg({
            repository: {
              type: "git",
              url: input,
            },
          })
        ).toEqual(output);
      });
    });

    it(`works with shorthand 'repository' syntax`, function() {
      expect(
        findRepoFromPkg({
          repository: "https://github.com/babel/ember-cli-babel",
        })
      ).toEqual("babel/ember-cli-babel");
    });
  });
});
