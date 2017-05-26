import fetch from "node-fetch";

import ApiDataCache from "./ApiDataCache";
import ConfigurationError from "./ConfigurationError";

export default class GithubAPI {
  constructor(config) {
    const { repo } = config;
    this.repo = repo;
    this.cache = new ApiDataCache("github", config);
    this.auth = this.getAuthToken();
    if (!this.auth) {
      throw new ConfigurationError("Must provide GITHUB_AUTH");
    }
  }

  getAuthToken() {
    return process.env.GITHUB_AUTH;
  }

  async getIssueData(issue) {
    return this._get(`repos/${this.repo}/issues`, issue);
  }

  async getUserData(login) {
    return this._get("users", login);
  }

  async _get(type, key) {
    let data = this.cache.get(type, key);
    if (!data) {
      data = await this._fetch(type, key);
      this.cache.set(type, key, data);
    }
    return JSON.parse(data);
  }

  async _fetch(type, key) {
    const url = `https://api.github.com/${type}/${key}`;
    const res = await fetch(url, {
      headers: {
        "Authorization": `token ${this.auth}`,
      },
    });
    return res.text();
  }
}
