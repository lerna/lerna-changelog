import GithubAPI, {GitHubIssueResponse, GitHubUserResponse} from "./github-api";

export interface Options {
  repo: string;
  rootPath: string;
  cacheDir?: string;
}

export default class RemoteRepo {
  repo: string;
  githubAPI: GithubAPI;

  constructor(config: Options) {
    const { repo } = config;
    this.repo = repo;
    this.githubAPI = new GithubAPI(config);
  }

  getBaseIssueUrl(): string {
    return this.githubAPI.getBaseIssueUrl(this.repo);
  }

  async getIssueData(issue: string): Promise<GitHubIssueResponse> {
    return this.githubAPI.getIssueData(this.repo, issue);
  }

  async getUserData(login: string): Promise<GitHubUserResponse> {
    return this.githubAPI.getUserData(login);
  }
}
