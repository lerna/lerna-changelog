const path = require("path");

import ConfigurationError from "../configuration-error";
import fetch from "../fetch";
import { GitHostingAPI, GitHostingIssueResponse, GitHostingUserResponse, Options } from "./git-hosting-api";

export default class GithubEnterpriseAPI implements GitHostingAPI {
  private readonly cacheDir: string | undefined;
  private readonly auth: string;
  private readonly APIEndpoint: string;

  constructor(config: Options) {
    this.cacheDir = config.cacheDir && path.join(config.rootPath, config.cacheDir, "github-enterprise");
    this.auth = this.getAuthToken();
    this.APIEndpoint = this.createAPIEndpoint(config.gitHostingServerURL);
    if (!this.auth) {
      throw new ConfigurationError("Must provide GITHUB_ENTERPRISE_AUTH");
    }
  }

  public getBaseIssueUrl(repo: string): string {
    return `${this.APIEndpoint}/repos/${repo}/issues/`;
  }

  public async getIssueData(repo: string, issue: string): Promise<GitHostingIssueResponse> {
    return this._fetch(`${this.APIEndpoint}/repos/${repo}/issues/${issue}`);
  }

  public async getUserData(login: string): Promise<GitHostingUserResponse> {
    return this._fetch(`${this.APIEndpoint}/users/${login}`);
  }

  private async _fetch(url: string): Promise<any> {
    const res = await fetch(url, {
      cachePath: this.cacheDir,
      headers: {
        Authorization: `token ${this.auth}`,
      },
    });
    const parsedResponse = await res.json();
    if (res.ok) {
      return parsedResponse;
    }
    throw new ConfigurationError(`Fetch error: ${res.statusText}.\n${JSON.stringify(parsedResponse)}`);
  }

  private getAuthToken(): string {
    return process.env.GITHUB_ENTERPRISE_AUTH || "";
  }

  private createAPIEndpoint(hostingServerURL: string): string {
    return hostingServerURL.endsWith("/") ? `${hostingServerURL}api/v3` : `${hostingServerURL}/api/v3`;
  }
}
