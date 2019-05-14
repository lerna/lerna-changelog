import { Commit } from "../commit";
import { Issue, User } from "../interfaces";
import ConfigurationError from "../utils/configuration-error";
import fetch from "../utils/fetch";
import { AbstractGitApi, Options } from "./abstract-api";

export interface GitHubUserResponse {
  login: string;
  name: string;
  html_url: string;
}

export interface GitHubIssueResponse {
  number: number;
  title: string;
  pull_request?: {
    html_url: string;
  };
  labels: Array<{
    name: string;
  }>;
  user: {
    login: string;
    html_url: string;
  };
}

export default class GithubAPI extends AbstractGitApi<GitHubIssueResponse> {
  public static getIssueNumber(message: string): string | null {
    const lines = message.split("\n");
    const firstLine = lines[0];

    const mergeMatch = firstLine.match(/^Merge pull request #(\d+) from /);
    if (mergeMatch) {
      return mergeMatch[1];
    }

    const squashMergeMatch = firstLine.match(/\(#(\d+)\)$/);
    if (squashMergeMatch) {
      return squashMergeMatch[1];
    }

    const homuMatch = firstLine.match(/^Auto merge of #(\d+) - /);
    if (homuMatch) {
      return homuMatch[1];
    }

    return null;
  }

  public readonly gitServer: string = "https://github.com";
  public readonly gitApiUrl: string = "https://api.github.com";

  public get baseIssueUrl(): string {
    return `${this.gitServer}/${this.repo}/issues/`;
  }

  constructor(config: Options) {
    super(config);
    // TODO read githubServer & githubApiUrl from config
    this.gitServer = this.getGithubServer() || "https://github.com";
    this.gitApiUrl = this.getGithubApiServer() || "https://api.github.com";
  }
  public async getIssueNumber(commit: Commit): Promise<string | null> {
    return GithubAPI.getIssueNumber(commit.message);
  }

  protected async IssueTransformer(IssueData: GitHubIssueResponse): Promise<Issue> {
    const { number: id, title, pull_request, labels, user } = IssueData;
    const pullRequest = pull_request && pull_request.html_url;

    // If a list of `ignoreCommitters` is provided in the lerna.json config
    // check if the current committer should be kept or not.
    const shouldKeepCommiter = user.login && !this.ignoreCommitter(user.login);

    let userData: User;
    if (shouldKeepCommiter) {
      userData = await this.UserTranformer(await this.getUserData(user.login));
    } else {
      userData = {
        login: user.login,
        url: user.html_url,
        shouldKeepCommiter: false,
      };
    }

    return {
      id,
      title,
      pullRequest,
      labels: (labels || []).map(l => l.name),
      user: userData,
    };
  }
  protected getIssueData(issue: string): Promise<GitHubIssueResponse> {
    return this._fetch(`${this.gitApiUrl}/repos/${this.repo}/issues/${issue}`);
  }

  protected getAuthToken(): string {
    if (!process.env.GITHUB_AUTH) {
      throw new ConfigurationError("Must provide GITHUB_AUTH");
    }
    return process.env.GITHUB_AUTH;
  }

  private getGithubServer(): string {
    return process.env.GITHUB_SERVER;
  }

  private getGithubApiServer(): string {
    return process.env.GITHUB_API_SERVER;
  }

  private async UserTranformer(UserData: GitHubUserResponse): Promise<User> {
    const { login, name, html_url: url } = UserData;
    return { login, name, url, shouldKeepCommiter: true };
  }
  private getUserData(login: string): Promise<GitHubUserResponse> {
    return this._fetch(`${this.gitApiUrl}/users/${login}`);
  }

  private async _fetch(url: string): Promise<any> {
    const res = await fetch(url, {
      cacheManager: this.cacheDir,
      headers: {
        Authorization: `token ${this.auth}`,
      },
    });
    return res.json();
  }
}
