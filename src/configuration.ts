const execa = require("execa");

import { Configuration, GitProvider } from "./interfaces";
import ConfigurationError from "./utils/configuration-error";
import { readLernaJSON, readPackageJSON } from "./utils/load-json";

export interface ConfigLoaderOptions {
  gitProvider?: GitProvider;
  nextVersionFromMetadata?: boolean;
}

export function load(options: ConfigLoaderOptions = {}): Configuration {
  let cwd = process.cwd();
  let rootPath = execa.sync("git", ["rev-parse", "--show-toplevel"], { cwd }).stdout;

  return fromPath(rootPath, options);
}

export function fromPath(rootPath: string, options: ConfigLoaderOptions = {}): Configuration {
  const lernaJSON = readLernaJSON(rootPath);
  const packageJSON = readPackageJSON(rootPath);

  // Step 1: load partial config from `package.json` or `lerna.json`
  let config: Partial<Configuration> = (packageJSON || {}).changelog || (lernaJSON || {}).changelog || {};

  if (!config.repo && !(packageJSON || {}).repository) {
    throw new ConfigurationError('Could not infer "repo" from the "package.json" file.');
  }

  // Step 2: fill partial config with defaults
  let { repo, nextVersion, labels, cacheDir, ignoreCommitters } = config;

  if (options.nextVersionFromMetadata || config.nextVersionFromMetadata) {
    nextVersion = findNextVersion(packageJSON, lernaJSON);

    if (!nextVersion) {
      throw new ConfigurationError('Could not infer "nextVersion" from the "package.json" file.');
    }
  }

  if (!labels) {
    labels = {
      breaking: ":boom: Breaking Change",
      enhancement: ":rocket: Enhancement",
      bug: ":bug: Bug Fix",
      documentation: ":memo: Documentation",
      internal: ":house: Internal",
    };
  }

  if (!ignoreCommitters) {
    ignoreCommitters = [
      "dependabot-bot",
      "dependabot[bot]",
      "greenkeeperio-bot",
      "greenkeeper[bot]",
      "renovate-bot",
      "renovate[bot]",
    ];
  }

  const gitProvider = options.gitProvider || config.gitProvider || "github";

  return {
    repo: repo!,
    gitProvider,
    nextVersion,
    rootPath,
    labels,
    ignoreCommitters,
    cacheDir,
    pkg: packageJSON,
  };
}

function findNextVersion(packageJSON: any = {}, lernaJSON: any = {}): string | undefined {
  return packageJSON.version ? `v${packageJSON.version}` : lernaJSON.version ? `v${lernaJSON.version}` : undefined;
}
