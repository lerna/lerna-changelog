import fs from "fs";
import path from "path";

import ConfigurationError from "./ConfigurationError";
import execSync from "./execSync";

export function fromGitRoot(cwd) {
  const rootPath = execSync("git rev-parse --show-toplevel", { cwd });

  const lernaPath = path.join(rootPath, "lerna.json");
  const lernaJson = JSON.parse(fs.readFileSync(lernaPath));

  const config = lernaJson.changelog;

  if (!config) {
    throw new ConfigurationError(
      "Missing changelog config in `lerna.json`.\n" +
      "See docs for setup: https://github.com/lerna/lerna-changelog#readme"
    );
  }

  config.rootPath = rootPath;

  return config;
}
