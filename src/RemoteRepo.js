import * as GithubAPI from "./GithubAPI";

export default class RemoteRepo {
  constructor({repo, labels}) {
    this.repo = repo;
    this.labels = labels;
  }

  getLabels() {
    return Object.keys(this.labels);
  }

  getHeadingForLabel(label) {
    return this.labels[label];
  }

  getBaseIssueUrl() {
    return "https://github.com/" + this.repo + "/issues/";
  }

  getBasePullRequestUrl() {
    return "https://github.com/" + this.repo + "/pull/";
  }

  getIssueData(issue) {
    var url  = "https://api.github.com/repos/" + this.repo + "/issues/" + issue;
    return GithubAPI.request(url);
  }
}
