import { Commit } from "./commit";

export interface User {
  login: string;
  name?: string;
  url: string;
  shouldKeepCommiter: boolean;
}

export interface Issue {
  // issue or mr id
  id: number;
  title: string;
  // pull request html url
  pullRequest?: string;
  labels?: string[];
  user: User;
}

export interface CommitInfo {
  commitSHA: string;
  message: string;
  tags?: string[];
  date: string;
  // issueNumber: string | null;
  issue?: Issue;
  // githubIssue?: GitHubIssueResponse;
  categories?: string[];
  packages?: string[];
}

export interface IRelease {
  name: string;
  date: string;
  commits: CommitInfo[];
  contributors?: User[];
}

export interface CommitListItem {
  sha: string;
  refName: string;
  summary: string;
  date: string;
}

export type GitProvider = "github" | "gitlab";

export interface Configuration {
  repo: string;
  rootPath: string;
  labels: { [key: string]: string };
  ignoreCommitters: string[];
  cacheDir?: string;
  nextVersion: string | undefined;
  nextVersionFromMetadata?: boolean;
  gitProvider: GitProvider;
  pkg: any;
}

export interface IGitApi {
  readonly baseIssueUrl: string;
  readonly repo: string;
  readonly gitServer: string;
  readonly gitApiUrl: string;
  getIssue(issue: string): Promise<Issue>;
  getIssueNumber(commit: Commit): Promise<string | null>;
}
