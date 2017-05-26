import GithubAPI from "./GithubAPI";

export default class RemoteRepo {
  constructor(config) {
    const { repo, labels } = config;
    this.repo = repo;
    this.labels = labels;
    this.githubAPI = new GithubAPI(config);
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

  async getIssueData(issue) {
    return this.githubAPI.getIssueData(issue);
  }

  getUserData(login) {
    return this.githubAPI.getUserData(login);
  }
}
