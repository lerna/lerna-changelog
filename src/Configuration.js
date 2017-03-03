import LernaRepo from "lerna/lib/Repository";
import ConfigurationError from "./ConfigurationError";

export function fromCWD() {
  const lerna = new LernaRepo();

  const config = lerna.lernaJson.changelog;

  if (!config) {
    throw new ConfigurationError(
      "Missing changelog config in `lerna.json`.\n" +
      "See docs for setup: https://github.com/lerna/lerna-changelog#readme"
    );
  }

  config.rootPath = lerna.rootPath;

  return config;
}
