import execSync from "./execSync";
import ApiDataCache from "./ApiDataCache";
import ConfigurationError from "./ConfigurationError";
import { resolve } from "url";

export default class GithubAPI {
  constructor(config) {
    const { repo, enterpriseUrl } = config;
    this.repo = repo;
    this.enterpriseUrl = enterpriseUrl && resolve(enterpriseUrl, "/api/v3/");
    this.cache = new ApiDataCache("github", config);
    this.auth = this.getAuthToken();
    if (!this.auth) {
      throw new ConfigurationError("Must provide GITHUB_AUTH");
    }
  }

  getAuthToken() {
    return this.enterpriseUrl ? process.env.GITHUB_ENTERPRISE_AUTH : process.env.GITHUB_AUTH;
  }

  getApiUrl () {
    return this.enterpriseUrl || "https://api.github.com";
  }

  getIssueData(issue) {
    return this._get("issue", issue);
  }

  getUserData(login) {
    return this._get("user", login);
  }

  _get(type, key) {
    let data = this.cache.get(type, key);
    if (!data) {
      data = this._fetch(type, key);
      this.cache.set(type, key, data);
    }
    return JSON.parse(data);
  }

  _fetch(type, key) {
    const path = {
      issue : `repos/${this.repo}/issues/${key}`,
      user  : `users/${key}`
    }[type];
    const token = this.getAuthToken();
    const url = resolve(this.getApiUrl(), path);
    return execSync("curl -H 'Authorization: token " +
      token +
      "' --silent --globoff " + url
    );
  }
}
