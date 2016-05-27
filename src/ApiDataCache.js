import fs from "fs";
import path from "path";
import mkdirp from "mkdirp";
import ConfigurationError from "./ConfigurationError";

export default class ApiDataCache {
  constructor(host, {rootPath, cacheDir}) {
    this.host = host;
    const dir = this.dir = cacheDir && path.join(rootPath, cacheDir, host);

    if (dir) {
      try {
        mkdirp.sync(dir);
      } catch (e) {
        throw new ConfigurationError(`Can't use cacheDir "${cacheDir}" (${e.message})`);
      }
    }
  }

  get(type, key) {
    if (!this.dir) return;
    try {
      return fs.readFileSync(this.fn(type, key), "utf-8");
    } catch (e) {
      // Pass.
    }
  }

  set(type, key, data) {
    if (!this.dir) return;
    return fs.writeFileSync(this.fn(type, key), data);
  }

  fn(type, key) {
    const dir = path.join(this.dir, type);

    // Ensure the directory for this type is there.
    mkdirp.sync(dir);

    return path.join(dir, key);
  }
}
