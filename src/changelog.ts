const pMap = require("p-map");

import progressBar        from "./progress-bar";
import RemoteRepo         from "./remote-repo";
import * as Configuration from "./configuration";
import findPullRequestId  from "./find-pull-request-id";
import * as Git from "./git";
import {GitHubIssueResponse} from "./github-api";

const UNRELEASED_TAG = "___unreleased___";
const COMMIT_FIX_REGEX = /(fix|close|resolve)(e?s|e?d)? [T#](\d+)/i;

interface CommitInfo {
  commitSHA: string;
  message: string;
  tags?: string[];
  date: string;
  issueNumber: string | null;
  githubIssue?: GitHubIssueResponse;
  categories?: string[];
  packages?: string[];
}

interface Release {
  name: string;
  date: string;
  commits: CommitInfo[];
}

interface CategoryInfo {
  name: string | undefined;
  commits: CommitInfo[];
}

export default class Changelog {
  config: any;
  remote: RemoteRepo;
  tagFrom?: string;
  tagTo?: string;

  constructor(options: any = {}) {
    this.config = this.getConfig();
    this.remote = new RemoteRepo(this.config);

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

  async createMarkdown() {
    let markdown = "\n";

    // Get all info about commits in a certain tags range
    const commitsInfo = await this.getCommitInfos();

    // Step 6: Group commits by release (local)
    const releases = await this.groupByRelease(commitsInfo);

    for (const release of releases) {
      // Step 7: Group commits in release by category (local)
      const categories = this.groupByCategory(release.commits);
      const categoriesWithCommits = categories.filter((category) => category.commits.length > 0);

      // Skip this iteration if there are no commits available for the release
      if (categoriesWithCommits.length === 0) continue;

      // Step 8: Compile list of committers in release (local + remote)
      const committers = await this.getCommitters(release.commits);

      const releaseTitle = release.name === UNRELEASED_TAG ? "Unreleased" : release.name;
      markdown += `## ${releaseTitle} (${release.date})`;

      progressBar.init(categories.length);

      for (const category of categoriesWithCommits) {
        progressBar.setTitle(category.name || "Other");

        // Step 9: Group commits in category by package (local)
        const commitsByPackage: { [id: string]: CommitInfo[] } = {};
        for (const commit of category.commits) {
          // Array of unique packages.
          const changedPackages = commit.packages || [];

          const heading = changedPackages.length > 0
            ? `* ${changedPackages.map((pkg) => `\`${pkg}\``).join(", ")}`
            : "* Other";

          commitsByPackage[heading] = commitsByPackage[heading] || [];
          commitsByPackage[heading].push(commit);
        }

        markdown += "\n";
        markdown += "\n";
        markdown += `#### ${category.name}`;

        const headings = Object.keys(commitsByPackage);
        const onlyOtherHeading = headings.length === 1 && headings[0] === "* Other";

        // Step 10: Print commits
        for (const heading of headings) {
          const commits = commitsByPackage[heading];

          if (!onlyOtherHeading) {
            markdown += `\n${heading}`;
          }

          for (const commit of commits) {
            const issue = commit.githubIssue;
            if (issue) {
              markdown += onlyOtherHeading ? "\n* " : "\n  * ";

              if (issue.number && issue.pull_request && issue.pull_request.html_url) {
                const prUrl = issue.pull_request.html_url;
                markdown += `[#${issue.number}](${prUrl}) `;
              }

              if (issue.title && issue.title.match(COMMIT_FIX_REGEX)) {
                issue.title = issue.title.replace(
                  COMMIT_FIX_REGEX,
                  `Closes [#$3](${this.remote.getBaseIssueUrl()}$3)`
                );
              }

              markdown += `${issue.title}. ([@${issue.user.login}](${issue.user.html_url}))`;
            }
          }
        }

        progressBar.tick();
      }

      progressBar.terminate();

      markdown += `\n\n#### Committers: ${committers.length}\n`;
      markdown += committers.map((commiter) => `- ${commiter}`).join("\n");
      markdown += "\n\n\n";
    }

    return markdown.substring(0, markdown.length - 3);
  }

  getListOfUniquePackages(sha: string): string[] {
    return Git.changedPaths(sha)
      .map((path: string) => path.indexOf("packages/") === 0 ? path.slice(9).split("/", 1)[0] : "")
      .filter(Boolean)
      .filter(onlyUnique);
  }

  async getListOfTags(): Promise<string[]> {
    return Git.listTagNames();
  }

  async getLastTag() {
    return Git.lastTag();
  }

  async getListOfCommits(): Promise<Git.CommitListItem[]> {
    // Determine the tags range to get the commits for. Custom from/to can be
    // provided via command-line options.
    // Default is "from last tag".
    const tagFrom = this.tagFrom || (await this.getLastTag());
    return Git.listCommits(tagFrom, this.tagTo);
  }

  async getCommitters(commits: CommitInfo[]): Promise<string[]> {
    const committers: { [id: string]: string } = {};

    for (const commit of commits) {
      const issue = commit.githubIssue;
      const login = issue && issue.user.login;
      // If a list of `ignoreCommitters` is provided in the lerna.json config
      // check if the current committer should be kept or not.
      const shouldKeepCommiter = login && !this.ignoreCommitter(login);
      if (login && shouldKeepCommiter && !committers[login]) {
        const user = await this.remote.getUserData(login);
        const userNameAndLink = `[${login}](${user.html_url})`;
        if (user.name) {
          committers[login] = `${user.name} (${userNameAndLink})`;
        } else {
          committers[login] = userNameAndLink;
        }
      }
    }

    return Object.keys(committers).map((k) => committers[k]).sort();
  }

  ignoreCommitter(login: string): boolean {
    if (!this.config.ignoreCommitters) {
      return false;
    }

    return this.config.ignoreCommitters.some((c: string) => c === login || login.indexOf(c) > -1)
  }

  async toCommitInfos(commits: Git.CommitListItem[]): Promise<CommitInfo[]> {
    const allTags = await this.getListOfTags();
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

  async groupByRelease(commits: CommitInfo[]): Promise<Release[]> {
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

  groupByCategory(allCommits: CommitInfo[]): CategoryInfo[] {
    const { labels } = this.config;

    return Object.keys(labels).map((label) => {
      let name = labels[label];

      // Keep only the commits that have a matching label with the one
      // provided in the lerna.json config.
      let commits = allCommits
        .filter((commit) => commit.categories && commit.categories.indexOf(name) !== -1);

      return { name, commits };
    });
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
    for (const commit of commits) {
      commit.packages = this.getListOfUniquePackages(commit.commitSHA);
    }
  }
}

function onlyUnique(value: any, index: number, self: any[]): boolean {
  return self.indexOf(value) === index;
}
