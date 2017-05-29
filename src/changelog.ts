const pMap = require("p-map");

import progressBar        from "./progress-bar";
import RemoteRepo         from "./remote-repo";
import * as Configuration from "./configuration";
import findPullRequestId  from "./find-pull-request-id";
import * as Git from "./git";
import {GitHubUserResponse} from "./github-api";
import {CommitInfo, Release} from "./interfaces";
import MarkdownRenderer from "./markdown-renderer";

const UNRELEASED_TAG = "___unreleased___";

export default class Changelog {
  config: any;
  remote: RemoteRepo;
  renderer: MarkdownRenderer;
  tagFrom?: string;
  tagTo?: string;

  constructor(options: any = {}) {
    this.config = this.getConfig();
    this.remote = new RemoteRepo(this.config);
    this.renderer = new MarkdownRenderer({
      categories: Object.keys(this.config.labels).map(key => this.config.labels[key]),
      baseIssueUrl: this.remote.getBaseIssueUrl(),
    });

    // CLI options
    this.tagFrom = options["tag-from"];
    this.tagTo = options["tag-to"];
  }

  getConfig() {
    return Configuration.fromGitRoot(process.cwd());
  }

  async getCommitInfos(): Promise<CommitInfo[]> {
    // Step 1: Get list of commits between tag A and B (local)
    const commits = await this.getListOfCommits();

    // Step 2: Find tagged commits (local)
    const commitInfos = await this.toCommitInfos(commits);

    // Step 3: Download PR data (remote)
    await this.downloadIssueData(commitInfos);

    // Step 4: Fill in categories from remote labels (local)
    this.fillInCategories(commitInfos);

    // Step 5: Fill in packages (local)
    this.fillInPackages(commitInfos);

    return commitInfos;
  }

  async listReleases(): Promise<Release[]> {
    // Get all info about commits in a certain tags range
    const commits = await this.getCommitInfos();

    // Step 6: Group commits by release (local)
    let releases = this.groupByRelease(commits);

    // Step 7: Compile list of committers in release (local + remote)
    await this.fillInContributors(releases);

    return releases;
  }

  async createMarkdown() {
    const releases = await this.listReleases();

    return this.renderer.renderMarkdown(releases);
  }

  getListOfUniquePackages(sha: string): string[] {
    return Git.changedPaths(sha)
      .map((path: string) => path.indexOf("packages/") === 0 ? path.slice(9).split("/", 1)[0] : "")
      .filter(Boolean)
      .filter(onlyUnique);
  }

  async getListOfCommits(): Promise<Git.CommitListItem[]> {
    // Determine the tags range to get the commits for. Custom from/to can be
    // provided via command-line options.
    // Default is "from last tag".
    const tagFrom = this.tagFrom || (await Git.lastTag());
    return Git.listCommits(tagFrom, this.tagTo);
  }

  async getCommitters(commits: CommitInfo[]): Promise<GitHubUserResponse[]> {
    const committers: { [id: string]: GitHubUserResponse } = {};

    for (const commit of commits) {
      const issue = commit.githubIssue;
      const login = issue && issue.user.login;
      // If a list of `ignoreCommitters` is provided in the lerna.json config
      // check if the current committer should be kept or not.
      const shouldKeepCommiter = login && !this.ignoreCommitter(login);
      if (login && shouldKeepCommiter && !committers[login]) {
        committers[login] = await this.remote.getUserData(login);
      }
    }

    return Object.keys(committers).map((k) => committers[k]);
  }

  ignoreCommitter(login: string): boolean {
    if (!this.config.ignoreCommitters) {
      return false;
    }

    return this.config.ignoreCommitters.some((c: string) => c === login || login.indexOf(c) > -1)
  }

  async toCommitInfos(commits: Git.CommitListItem[]): Promise<CommitInfo[]> {
    const allTags = await Git.listTagNames();
    return commits.map((commit) => {
      const { sha, refName, summary: message, date } = commit;

      let tagsInCommit;
      if (refName.length > 1) {
        // Since there might be multiple tags referenced by the same commit,
        // we need to treat all of them as a list.
        tagsInCommit = allTags.filter(tag => refName.indexOf(tag) !== -1);
      }

      const issueNumber = findPullRequestId(message);

      return {
        commitSHA: sha,
        message: message,
        // Note: Only merge commits or commits referencing an issue / PR
        // will be kept in the changelog.
        tags: tagsInCommit,
        issueNumber,
        date,
      } as CommitInfo;
    });
  }

  async downloadIssueData(commitInfos: CommitInfo[]) {
    progressBar.init(commitInfos.length);
    await pMap(commitInfos, async (commitInfo: CommitInfo) => {
      progressBar.setTitle(commitInfo.commitSHA);

      if (commitInfo.issueNumber) {
        commitInfo.githubIssue = await this.remote.getIssueData(commitInfo.issueNumber);
      }

      progressBar.tick();
    }, { concurrency: 5 });
    progressBar.terminate();
  }

  groupByRelease(commits: CommitInfo[]): Release[] {
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

    return Object.keys(releaseMap).map((tag) => releaseMap[tag]);
  }

  getToday() {
    const date = new Date().toISOString();
    return date.slice(0, date.indexOf("T"));
  }

  fillInCategories(commits: CommitInfo[]) {
    for (const commit of commits) {
      if (!commit.githubIssue) continue;

      const labels = commit.githubIssue.labels.map((label) => label.name.toLowerCase());

      commit.categories = Object.keys(this.config.labels)
        .filter((label) => labels.indexOf(label.toLowerCase()) !== -1)
        .map((label) => this.config.labels[label]);
    }
  }

  fillInPackages(commits: CommitInfo[]) {
    progressBar.init(commits.length);
    for (const commit of commits) {
      progressBar.setTitle(commit.commitSHA);
      commit.packages = this.getListOfUniquePackages(commit.commitSHA);
      progressBar.tick();
    }
    progressBar.terminate();
  }

  async fillInContributors(releases: Release[]) {
    for (const release of releases) {
      release.contributors = await this.getCommitters(release.commits);
    }
  }
}

function onlyUnique(value: any, index: number, self: any[]): boolean {
  return self.indexOf(value) === index;
}
