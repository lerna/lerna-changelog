const pMap = require("p-map");

import progressBar from "./progress-bar";
import { Configuration } from "./configuration";
import findPullRequestId from "./find-pull-request-id";
import * as Git from "./git";
import GithubAPI, { GitHubUserResponse } from "./github-api";
import { CommitInfo, Release } from "./interfaces";
import MarkdownRenderer from "./markdown-renderer";

const UNRELEASED_TAG = "___unreleased___";

interface Options {
  tagFrom?: string;
  tagTo?: string;
}

export default class Changelog {
  private readonly config: Configuration;
  private github: GithubAPI;
  private renderer: MarkdownRenderer;

  constructor(config: Configuration) {
    this.config = config;
    this.github = new GithubAPI(this.config);
    this.renderer = new MarkdownRenderer({
      categories: Object.keys(this.config.labels).map(key => this.config.labels[key]),
      baseIssueUrl: this.github.getBaseIssueUrl(this.config.repo),
      unreleasedName: this.config.nextVersion || "Unreleased",
    });
  }

  public async createMarkdown(options: Options = {}) {
    const from = options.tagFrom || (await Git.lastTag());
    const to = options.tagTo || "HEAD";

    const releases = await this.listReleases(from, to);

    return this.renderer.renderMarkdown(releases);
  }

  private async getCommitInfos(from: string, to: string): Promise<CommitInfo[]> {
    // Step 1: Get list of commits between tag A and B (local)
    const commits = this.getListOfCommits(from, to);

    // Step 2: Find tagged commits (local)
    const commitInfos = this.toCommitInfos(commits);

    // Step 3: Download PR data (remote)
    await this.downloadIssueData(commitInfos);

    // Step 4: Fill in categories from remote labels (local)
    this.fillInCategories(commitInfos);

    // Step 5: Fill in packages (local)
    await this.fillInPackages(commitInfos);

    return commitInfos;
  }

  private async listReleases(from: string, to: string): Promise<Release[]> {
    // Get all info about commits in a certain tags range
    const commits = await this.getCommitInfos(from, to);

    // Step 6: Group commits by release (local)
    let releases = this.groupByRelease(commits);

    // Step 7: Compile list of committers in release (local + remote)
    await this.fillInContributors(releases);

    return releases;
  }

  private async getListOfUniquePackages(sha: string): Promise<string[]> {
    return (await Git.changedPaths(sha))
      .map(path => this.packageFromPath(path))
      .filter(Boolean)
      .filter(onlyUnique);
  }

  private packageFromPath(path: string): string {
    const parts = path.split("/");
    if (parts[0] !== "packages" || parts.length < 3) {
      return "";
    }

    if (parts.length >= 4 && parts[1][0] === "@") {
      return `${parts[1]}/${parts[2]}`;
    }

    return parts[1];
  }

  private getListOfCommits(from: string, to: string): Git.CommitListItem[] {
    // Determine the tags range to get the commits for. Custom from/to can be
    // provided via command-line options.
    // Default is "from last tag".
    return Git.listCommits(from, to);
  }

  private async getCommitters(commits: CommitInfo[]): Promise<GitHubUserResponse[]> {
    const committers: { [id: string]: GitHubUserResponse } = {};

    for (const commit of commits) {
      const issue = commit.githubIssue;
      const login = issue && issue.user && issue.user.login;
      // If a list of `ignoreCommitters` is provided in the lerna.json config
      // check if the current committer should be kept or not.
      const shouldKeepCommiter = login && !this.ignoreCommitter(login);
      if (login && shouldKeepCommiter && !committers[login]) {
        committers[login] = await this.github.getUserData(login);
      }
    }

    return Object.keys(committers).map(k => committers[k]);
  }

  private ignoreCommitter(login: string): boolean {
    return this.config.ignoreCommitters.some((c: string) => c === login || login.indexOf(c) > -1);
  }

  private toCommitInfos(commits: Git.CommitListItem[]): CommitInfo[] {
    return commits.map(commit => {
      const { sha, refName, summary: message, date } = commit;

      let tagsInCommit;
      if (refName.length > 1) {
        const TAG_PREFIX = "tag: ";

        // Since there might be multiple tags referenced by the same commit,
        // we need to treat all of them as a list.
        tagsInCommit = refName
          .split(", ")
          .filter(ref => ref.startsWith(TAG_PREFIX))
          .map(ref => ref.substr(TAG_PREFIX.length));
      }

      const issueNumber = findPullRequestId(message);

      return {
        commitSHA: sha,
        message,
        // Note: Only merge commits or commits referencing an issue / PR
        // will be kept in the changelog.
        tags: tagsInCommit,
        issueNumber,
        date,
      } as CommitInfo;
    });
  }

  private async downloadIssueData(commitInfos: CommitInfo[]) {
    progressBar.init("Downloading issue information…", commitInfos.length);
    await pMap(
      commitInfos,
      async (commitInfo: CommitInfo) => {
        if (commitInfo.issueNumber) {
          commitInfo.githubIssue = await this.github.getIssueData(this.config.repo, commitInfo.issueNumber);
        }

        progressBar.tick();
      },
      { concurrency: 5 }
    );
    progressBar.terminate();
  }

  private groupByRelease(commits: CommitInfo[]): Release[] {
    // Analyze the commits and group them by tag.
    // This is useful to generate multiple release logs in case there are
    // multiple release tags.
    let releaseMap: { [id: string]: Release } = {};

    let currentTags = [UNRELEASED_TAG];
    for (const commit of commits) {
      if (commit.tags && commit.tags.length > 0) {
        currentTags = commit.tags;
      }

      // Tags referenced by commits are treated as a list. When grouping them,
      // we split the commits referenced by multiple tags in their own group.
      // This results in having one group of commits for each tag, even if
      // the same commits are "duplicated" across the different tags
      // referencing them.
      for (const currentTag of currentTags) {
        if (!releaseMap[currentTag]) {
          let date = currentTag === UNRELEASED_TAG ? this.getToday() : commit.date;
          releaseMap[currentTag] = { name: currentTag, date, commits: [] };
        }

        releaseMap[currentTag].commits.push(commit);
      }
    }

    return Object.keys(releaseMap).map(tag => releaseMap[tag]);
  }

  private getToday() {
    const date = new Date().toISOString();
    return date.slice(0, date.indexOf("T"));
  }

  private fillInCategories(commits: CommitInfo[]) {
    for (const commit of commits) {
      if (!commit.githubIssue || !commit.githubIssue.labels) continue;

      const labels = commit.githubIssue.labels.map(label => label.name.toLowerCase());

      commit.categories = Object.keys(this.config.labels)
        .filter(label => labels.indexOf(label.toLowerCase()) !== -1)
        .map(label => this.config.labels[label]);
    }
  }

  private async fillInPackages(commits: CommitInfo[]) {
    progressBar.init("Mapping commits to packages…", commits.length);

    try {
      await pMap(
        commits,
        async (commit: CommitInfo) => {
          commit.packages = await this.getListOfUniquePackages(commit.commitSHA);

          progressBar.tick();
        },
        { concurrency: 5 }
      );
    } finally {
      progressBar.terminate();
    }
  }

  private async fillInContributors(releases: Release[]) {
    for (const release of releases) {
      release.contributors = await this.getCommitters(release.commits);
    }
  }
}

function onlyUnique(value: any, index: number, self: any[]): boolean {
  return self.indexOf(value) === index;
}
