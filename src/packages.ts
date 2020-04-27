/* This file is an extracted version of the `getPackages` implementation from `@lerna/project`. */

import fs from "fs";
import path from "path";
import pMap from "p-map";
import globby from "globby";
import { Configuration } from "./configuration";
import ConfigurationError from "./configuration-error";

export type PackageInfo = {
  name: string;
  location: string;
};

export function getPackages(config: Configuration) {
  const packageLocations = getPackageLocations(config);
  if (!packageLocations) return Promise.resolve([]);

  const mapper = (packageConfigPath: string): PackageInfo => {
    const packageJson = require(packageConfigPath);
    return {
      name: packageJson.name,
      location: path.dirname(packageConfigPath),
    };
  };
  const fileFinder = makeFileFinder(config.rootPath, packageLocations);
  return fileFinder("package.json", filePaths => pMap(filePaths, mapper, { concurrency: 50 }));
}

function getPackageLocations(config: Configuration): string[] | undefined {
  const rootPackageJson = require(path.join(config.rootPath, "package.json"));
  const lernaJsonPath = path.join(config.rootPath, "lerna.json");

  if (!fs.existsSync(lernaJsonPath) && !rootPackageJson.workspaces) {
    // This is not a monorepo, fall back to single project.
    return undefined;
  }

  const lernaJson = require(path.join(config.rootPath, "lerna.json"));
  if (lernaJson.useWorkspaces) {
    const workspaces = rootPackageJson.workspaces;
    if (!workspaces) {
      throw new ConfigurationError(
        `Yarn workspaces need to be defined in the root package.json.\nSee: https://github.com/lerna/lerna/blob/master/commands/bootstrap/README.md#--use-workspaces`
      );
    }
    return workspaces.packages || workspaces;
  }
  return lernaJson.packages || ["packages/*"];
}

function makeFileFinder(rootPath: string, packageLocations: string[]) {
  const globOpts = {
    cwd: rootPath,
    absolute: true,
    followSymlinkedDirectories: false,
    // POSIX results always need to be normalized
    transform: (filePath: string) => path.normalize(filePath),
  };

  if (packageLocations.some(locationPath => locationPath.indexOf("**") > -1)) {
    if (packageLocations.some(locationPath => locationPath.indexOf("node_modules") > -1)) {
      throw new Error("An explicit node_modules package path does not allow globstars (**)");
    }

    // @ts-ignore
    globOpts.ignore = [
      // allow globs like "packages/**",
      // but avoid picking up node_modules/**/package.json
      "**/node_modules/**",
    ];
  }

  return (fileName: string, fileMapper: (filePaths: string[]) => Promise<PackageInfo[]>): Promise<PackageInfo[]> => {
    const promise = pMap(
      packageLocations.sort(),
      (globPath: string) =>
        globby(path.join(globPath, fileName), globOpts)
          .then((results: string[]) => results.sort())
          .then(fileMapper),
      { concurrency: 4 }
    );

    // always flatten the results
    return promise.then(flattenResults);
  };
}

function flattenResults(results: PackageInfo[][]) {
  return results.reduce<PackageInfo[]>((acc, result) => acc.concat(result), []);
}
