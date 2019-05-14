import { Commit } from "../commit";
import { Issue } from "../interfaces";
import ConfigurationError from "../utils/configuration-error";
import fetch from "../utils/fetch";
import { AbstractGitApi, Options } from "./abstract-api";

export interface GitLabUserResponse {
  login: string;
  name: string;
  html_url: string;
}

export interface GitLabMergeRequestResponse {
  iid: number;
  title: string;
  web_url: string;
  labels: string[];
  merge_commit_sha: string;
  author: {
    username: string;
    name: string;
    web_url: string;
  };
}

const ONE_DAY = 24 * 60 * 60 * 1000;

export default class GitlabAPI extends AbstractGitApi<GitLabMergeRequestResponse> {
  public readonly gitServer: string = "https://gitlab.com";
  public readonly gitApiUrl: string = "https://gitlab.com/api/v4";
  public get baseIssueUrl(): string {
    return `${this.gitServer}/${this.repo}/merge_requests/`;
  }
  private PROJECT_ID!: Promise<number>;
  public get projectId(): Promise<number> {
    if (!this.PROJECT_ID) {
      this.PROJECT_ID = this.getProjectId();
    }
    return this.PROJECT_ID;
  }

  constructor(config: Options) {
    super(config);
    // TODO read githubServer & githubApiUrl from config
    this.gitServer = this.getGitlabServer() || "https://gitlab.com";
    this.gitApiUrl = this.getGitlabApiServer() || `${this.gitServer}/api/v4`;
  }

  public async getIssueNumber(commit: Commit): Promise<string | null> {
    // NOTE maybe it has better solution?
    const createAfert = new Date(commit.date);
    const createBefore = new Date(createAfert.valueOf() + ONE_DAY);
    const mrs: GitLabMergeRequestResponse[] = await this._fetch(
      `${this.gitApiUrl}/projects/${await this
        .projectId}/merge_requests?created_after=${createAfert.toISOString()}&created_before=${createBefore.toISOString()}`
    );
    const mr = mrs.find(r => new RegExp("^" + commit.commitSHA).test(r.merge_commit_sha));
    if (mr) {
      return String(mr.iid);
    }
    return null;
  }

  protected async IssueTransformer(IssueData: GitLabMergeRequestResponse): Promise<Issue> {
    const { iid: id, title, web_url: pullRequest, labels, author } = IssueData;
    const shouldKeepCommiter = !!author.username && !this.ignoreCommitter(author.username);
    return {
      id,
      title,
      pullRequest,
      labels,
      user: {
        login: author.username,
        name: author.name,
        url: author.web_url,
        shouldKeepCommiter,
      },
    };
  }

  protected async getIssueData(issue: string): Promise<GitLabMergeRequestResponse> {
    return this._fetch(`${this.gitApiUrl}/projects/${await this.projectId}/merge_requests/${issue}`);
  }

  protected getAuthToken(): string {
    if (!process.env.GITLAB_AUTH) {
      throw new ConfigurationError("Must provide GITLAB_AUTH");
    }
    return process.env.GITLAB_AUTH;
  }

  private getGitlabServer(): string {
    return process.env.GITLAB_SERVER;
  }

  private getGitlabApiServer(): string {
    return process.env.GITLAB_API_SERVER || `${this.getGitlabServer() || "https://gitlab.com"}/api/v4`;
  }

  private async getProjectId(): Promise<number> {
    const projectData = await this._fetch(`${this.gitApiUrl}/projects/${encodeURIComponent(this.repo)}`);
    return projectData.id;
  }

  private async _fetch(url: string): Promise<any> {
    const res = await fetch(url, {
      cacheManager: this.cacheDir,
      headers: {
        "PRIVATE-TOKEN": this.auth,
      },
    });
    return res.json();
  }
}
