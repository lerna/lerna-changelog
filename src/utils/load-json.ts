import * as fs from "fs";
import * as path from "path";

export function readJSON(p: string): any | undefined {
  if (fs.existsSync(p)) {
    return JSON.parse(fs.readFileSync(p, { encoding: "utf-8" }));
  }
}

export function readLernaJSON(rootPath: string): any {
  const lernaPath = path.join(rootPath, "lerna.json");
  const config = readJSON(lernaPath);
  if (config) {
    return config;
  }
}

export function readPackageJSON(rootPath: string): any {
  const packagePath = path.join(rootPath, "package.json");
  const config = readJSON(packagePath);
  if (config) {
    return config;
  }
}
