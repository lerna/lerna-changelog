import execSync from "./execSync";
import IssueDataCache from "./IssueDataCache";

export default class GithubAPI {
  constructor(config) {
    const {repo} = config;
    this.repo = repo;
    this.cache = new IssueDataCache(config);
  }

  getIssueData(issue) {
    let data = this.cache.get(issue);
    if (!data) {
      data = this._fetch(issue);
      this.cache.set(issue, data);
    }
    return data;
  }

  _fetch(issue) {
    const url = "https://api.github.com/repos/" + this.repo + "/issues/" + issue;
    return execSync("curl -H 'Authorization: token " + process.env.GITHUB_AUTH + "' --silent " + url)
  }
}
