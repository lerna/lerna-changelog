const fetch = require("node-fetch");

import ApiDataCache from "./ApiDataCache";
import ConfigurationError from "./ConfigurationError";

export interface GitHubUserResponse {
  name: string;
  html_url: string;
}

export interface GitHubIssueResponse {
  labels: {
    name: string;
  }[];
}

export interface Options {
  repo: string;
  rootPath: string;
  cacheDir?: string;
}

export default class GithubAPI {
  repo: string;
  cache: ApiDataCache;
  auth: string;

  constructor(config: Options) {
    const { repo } = config;
    this.repo = repo;
    this.cache = new ApiDataCache("github", config);
    this.auth = this.getAuthToken();
    if (!this.auth) {
      throw new ConfigurationError("Must provide GITHUB_AUTH");
    }
  }

  getAuthToken(): string {
    return process.env.GITHUB_AUTH;
  }

  async getIssueData(issue: string): Promise<GitHubIssueResponse> {
    return this._get(`repos/${this.repo}/issues`, issue);
  }

  async getUserData(login: string): Promise<GitHubUserResponse> {
    return this._get("users", login);
  }

  async _get(type: string, key: string): Promise<any> {
    return this.cache.getOrRequest(type, key, () => this._fetch(type, key));
  }

  async _fetch(type: string, key: string): Promise<any> {
    const url = `https://api.github.com/${type}/${key}`;
    const res = await fetch(url, {
      headers: {
        "Authorization": `token ${this.auth}`,
      },
    });
    return res.json();
  }
}
