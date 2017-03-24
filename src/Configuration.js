import fs from "fs";
import path from "path";

import ConfigurationError from "./ConfigurationError";
import execSync from "./execSync";

export function fromGitRoot(cwd) {
  const rootPath = execSync("git rev-parse --show-toplevel", { cwd });
  return fromPath(rootPath);
}

export function fromPath(rootPath) {
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

function fromLernaConfig(rootPath) {
  const lernaPath = path.join(rootPath, "lerna.json");
  if (fs.existsSync(lernaPath)) {
    return JSON.parse(fs.readFileSync(lernaPath)).changelog;
  }
}

function fromPackageConfig(rootPath) {
  const pkgPath = path.join(rootPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    return JSON.parse(fs.readFileSync(pkgPath)).changelog;
  }
}
