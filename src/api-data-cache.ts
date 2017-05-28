const fs = require("fs-extra");
const path = require("path");
const mkdirp = require("mkdirp");

import ConfigurationError from "./configuration-error";

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

  get(key: string): any {
    if (!this.path) return;
    try {
      return fs.readJsonSync(`${this.path}/${key}.json`);
    } catch (e) {
      // Pass.
    }
  }

  async getOrRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
    let data = this.get(key);
    if (!data) {
      data = await fn();
      this.set(key, data);
    }
    return data;
  }

  set(key: string, data: any) {
    if (!this.path) return;
    return fs.outputJsonSync(`${this.path}/${key}.json`, data, { spaces: 2 });
  }
}
