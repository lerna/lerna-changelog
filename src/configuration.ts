const fs = require("fs");
const path = require("path");
const execa = require("execa");

import ConfigurationError from "./configuration-error";

export function fromGitRoot(cwd: string): any {
  const rootPath = execa.sync("git", ["rev-parse", "--show-toplevel"], { cwd }).stdout;
  return fromPath(rootPath);
}

export function fromPath(rootPath: string): any {
  const config = fromPackageConfig(rootPath) || fromLernaConfig(rootPath);

  if (!config) {
    throw new ConfigurationError(
      "Missing changelog config in `lerna.json`.\n" +
      "See docs for setup: https://github.com/lerna/lerna-changelog#readme"
    );
  }

  config.rootPath = rootPath;

  return config;
}

function fromLernaConfig(rootPath: string): any | undefined {
  const lernaPath = path.join(rootPath, "lerna.json");
  if (fs.existsSync(lernaPath)) {
    return JSON.parse(fs.readFileSync(lernaPath)).changelog;
  }
}

function fromPackageConfig(rootPath: string): any | undefined {
  const pkgPath = path.join(rootPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    return JSON.parse(fs.readFileSync(pkgPath)).changelog;
  }
}
