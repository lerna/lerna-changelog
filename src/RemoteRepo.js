import GithubAPI from "./GithubAPI";
import { resolve } from "url";

export default class RemoteRepo {
  constructor(config) {
    const { repo, labels, enterpriseUrl } = config;
    this.repo = repo;
    this.labels = labels;
    this.githubUrl = enterpriseUrl || "https://github.com/";
    this.githubAPI = new GithubAPI(config);
  }

  getLabels() {
    return Object.keys(this.labels);
  }

  getHeadingForLabel(label) {
    return this.labels[label];
  }

  getBaseIssueUrl() {
    return resolve(this.githubUrl + this.repo + "/", "issues/");
  }

  getBasePullRequestUrl() {
    return resolve(this.githubUrl + this.repo + "/", "pull/");
  }

  getIssueData(issue) {
    return this.githubAPI.getIssueData(issue);
  }

  getUserData(login) {
    return this.githubAPI.getUserData(login);
  }
}
