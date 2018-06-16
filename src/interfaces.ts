import { GitHubIssueResponse, GitHubUserResponse } from "./github-api";

export interface CommitInfo {
  commitSHA: string;
  message: string;
  tags?: string[];
  date: string;
  issueNumber: string | null;
  githubIssue?: GitHubIssueResponse;
  categories?: string[];
  packages?: string[];
}

export interface Release {
  name: string;
  date: string;
  commits: CommitInfo[];
  contributors?: GitHubUserResponse[];
}
