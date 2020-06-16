const path = require("path");

import ConfigurationError from "./configuration-error";
import fetch from "./fetch";

export interface Options {
  repo: string;
  rootPath: string;
  cacheDir?: string;
}

export default class API {
  private cacheDir: string | undefined;
  private auth: string;

  constructor(config: Options) {
    this.cacheDir = config.cacheDir && path.join(config.rootPath, config.cacheDir, "github");
    this.auth = this.getAuthToken();
    if (!this.auth) {
      throw new ConfigurationError("Must provide GITHUB_AUTH");
    }
  }

  protected async _fetch(url: string): Promise<any> {
    const res = await fetch(url, {
      cacheManager: this.cacheDir,
      headers: {
        Authorization: `token ${this.auth}`,
      },
    });
    return res.json();
  }

  private getAuthToken(): string {
    return process.env.GITHUB_AUTH || "";
  }
}
