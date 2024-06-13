import { GitHostingIssueResponse, GitHostingUserResponse } from "./git-hosting-api/git-hosting-api";

export interface CommitInfo {
  commitSHA: string;
  message: string;
  tags?: string[];
  date: string;
  issueNumber: string | null;
  gitHostingIssue?: GitHostingIssueResponse;
  categories?: string[];
  packages?: string[];
}

export interface Release {
  name: string;
  date: string;
  commits: CommitInfo[];
  contributors?: GitHostingUserResponse[];
}
