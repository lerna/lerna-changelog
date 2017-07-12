const path = require("path");

import ConfigurationError from "./configuration-error";
import fetch from "./fetch";

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
  labels: {
    name: string;
  }[];
  user: {
    login: string;
    html_url: string;
  };
}

export interface Options {
  repo: string;
  rootPath: string;
  cacheDir?: string;
}

export default class GithubAPI {
  repo: string;
  auth: string;

  constructor(config: Options) {
    const { repo } = config;
    this.repo = repo;
    this.auth = this.getAuthToken();
    if (!this.auth) {
      throw new ConfigurationError("Must provide GITHUB_AUTH");
    }
  }

  getAuthToken(): string {
    return process.env.GITHUB_AUTH;
  }

  async getIssueData(issue: string): Promise<GitHubIssueResponse> {
    return this._get(`repos/${this.repo}/issues/${issue}`);
  }

  async getUserData(login: string): Promise<GitHubUserResponse> {
    return this._get(`users/${login}`);
  }

  async _get(key: string): Promise<any> {
    return this._fetch(key);
  }

  async _fetch(key: string): Promise<any> {
    const url = `https://api.github.com/${key}`;
    const res = await fetch(url, {
      headers: {
        "Authorization": `token ${this.auth}`,
      },
    });
    return res.json();
  }
}
