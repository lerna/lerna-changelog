import GithubAPI from "./GithubAPI";

export default class RemoteRepo {
  repo: string;
  labels: { [id: string]: string; };
  githubAPI: GithubAPI;

  constructor(config: any) {
    const { repo, labels } = config;
    this.repo = repo;
    this.labels = labels;
    this.githubAPI = new GithubAPI(config);
  }

  getLabels(): string[] {
    return Object.keys(this.labels);
  }

  getHeadingForLabel(label: string): string | undefined {
    return this.labels[label];
  }

  getBaseIssueUrl(): string {
    return "https://github.com/" + this.repo + "/issues/";
  }

  getBasePullRequestUrl(): string {
    return "https://github.com/" + this.repo + "/pull/";
  }

  async getIssueData(issue: string): Promise<any> {
    return this.githubAPI.getIssueData(issue);
  }

  async getUserData(login: string): Promise<any> {
    return this.githubAPI.getUserData(login);
  }
}
