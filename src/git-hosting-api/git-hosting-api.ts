export interface GitHostingUserResponse {
  login: string;
  name: string;
  html_url: string;
}

export interface GitHostingIssueResponse {
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

export interface Options {
  repo: string;
  rootPath: string;
  cacheDir?: string;
  gitHostingServerURL: string;
}

export interface GitHostingAPI {
  getBaseIssueUrl(repo: string): string;
  getIssueData(repo: string, issue: string): Promise<GitHostingIssueResponse>;
  getUserData(login: string): Promise<GitHostingUserResponse>;
}
