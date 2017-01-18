import execSync from "./execSync";
import ApiDataCache from "./ApiDataCache";
import ConfigurationError from "./ConfigurationError";

export default class GithubAPI {
  constructor(config) {
    const {repo} = config;
    this.repo = repo;
    this.cache = new ApiDataCache('github', config);
    this.auth = process.env.GITHUB_AUTH;
    if (!this.auth) {
      throw new ConfigurationError("Must provide GITHUB_AUTH");
    }
  }

  getIssueData(issue) {
    return this._get('issue', issue);
  }

  getUserData(login) {
    return this._get('user', login);
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
      issue : `/repos/${this.repo}/issues/${key}`,
      user  : `/users/${key}`
    }[type];
    const url = "https://api.github.com" + path;
    return execSync("curl -H 'Authorization: token " + process.env.GITHUB_AUTH + "' --silent --globoff " + url)
  }
}
