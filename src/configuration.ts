const fs = require("fs");
const path = require("path");
const execa = require("execa");
const normalize = require("normalize-git-url");

import ConfigurationError from "./configuration-error";

export interface Configuration {
  repo: string;
  rootPath: string;
  labels: { [key: string]: string };
  ignoreCommitters: string[];
  cacheDir?: string;
}

export function load(options: Partial<Configuration> = {}): Configuration {
  let cwd = process.cwd();
  let rootPath = execa.sync("git", ["rev-parse", "--show-toplevel"], { cwd }).stdout;

  return fromPath(rootPath, options);
}

export function fromPath(rootPath: string, options: Partial<Configuration> = {}): Configuration {
  // Step 1: load partial config from `package.json` or `lerna.json`
  let config = fromPackageConfig(rootPath) || fromLernaConfig(rootPath) || {};

  // Step 2: override partial config with passed in options
  Object.assign(config, options);

  // Step 3: fill partial config with defaults
  let { repo, labels, cacheDir, ignoreCommitters } = config;

  if (!repo) {
    repo = findRepo(rootPath);
    if (!repo) {
      throw new ConfigurationError('Could not infer "repo” from the "package.json" file.');
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

  return {
    repo,
    rootPath,
    labels,
    ignoreCommitters,
    cacheDir,
  };
}

function fromLernaConfig(rootPath: string): Partial<Configuration> | undefined {
  const lernaPath = path.join(rootPath, "lerna.json");
  if (fs.existsSync(lernaPath)) {
    return JSON.parse(fs.readFileSync(lernaPath)).changelog;
  }
}

function fromPackageConfig(rootPath: string): Partial<Configuration> | undefined {
  const pkgPath = path.join(rootPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    return JSON.parse(fs.readFileSync(pkgPath)).changelog;
  }
}

function findRepo(rootPath: string): string | undefined {
  const pkgPath = path.join(rootPath, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath));
  if (!pkg.repository) {
    return;
  }

  return findRepoFromPkg(pkg);
}

export function findRepoFromPkg(pkg: any): string | undefined {
  const url = pkg.repository.url || pkg.repository;
  const normalized = normalize(url).url;
  const match = normalized.match(/github\.com[:/]([^./]+\/[^./]+)(?:\.git)?/);
  if (!match) {
    return;
  }

  return match[1];
}
