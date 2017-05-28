const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

import ConfigurationError from "./ConfigurationError";

export interface Options {
  path?: string;
}

export default class ApiDataCache {
  path?: string;

  constructor(options: Options) {
    this.path = options.path;

    if (this.path) {
      try {
        mkdirp.sync(this.path);
      } catch (e) {
        throw new ConfigurationError(`Can't use cache folder "${this.path}" (${e.message})`);
      }
    }
  }

  get(type: string, key: string): any {
    if (!this.path) return;
    try {
      return JSON.parse(fs.readFileSync(this.fn(type, key), "utf-8"));
    } catch (e) {
      // Pass.
    }
  }

  async getOrRequest<T>(type: string, key: string, fn: () => Promise<T>): Promise<T> {
    let data = this.get(type, key);
    if (!data) {
      data = await fn();
      this.set(type, key, data);
    }
    return data;
  }

  set(type: string, key: string, data: any) {
    if (!this.path) return;
    return fs.writeFileSync(this.fn(type, key), JSON.stringify(data, null, 2));
  }

  fn(type: string, key: string): string {
    const dir = path.join(this.path, type);

    // Ensure the directory for this type is there.
    mkdirp.sync(dir);

    return path.join(dir, key) + ".json";
  }
}
