const pMap = require("p-map");

import { CommitInfo, CommitListItem, Configuration, Issue, IGitApi } from "./interfaces";
import * as Git from "./utils/git";
import progressBar from "./utils/progress-bar";

export class Commit implements CommitInfo {
  public static ApiClient: IGitApi;
  public static config: Configuration;

  public static async transpile(commits: Commit[]) {
    // Step 3: Download PR data (remote)
    progressBar.init("Downloading issue information…", commits.length);
    await pMap(
      commits,
      async (commit: Commit) => {
        await commit.fillInIssue();
        progressBar.tick();
      },
      { concurrency: 5 }
    );
    progressBar.terminate();

    await pMap(
      commits,
      async (commit: Commit) => {
        // Step 4: Fill in categories from remote labels (local)
        commit.fillInCategories();
        // Step 5: Fill in packages (local)
        return commit.fillInPackages();
      },
      { concurrency: 5 }
    );
  }

  public get commitSHA() {
    return this.commitItem.sha;
  }
  public get message() {
    return this.commitItem.summary;
  }
  public get date() {
    return this.commitItem.date;
  }
  public tags?: string[];
  public issue?: Issue;
  public categories?: string[];
  public packages?: string[];

  private readonly commitItem: CommitListItem;

  constructor(commitItem: CommitListItem) {
    // Step 2: Find tagged commits (local)
    this.commitItem = commitItem;
    const { refName } = commitItem;
    if (refName.length > 1) {
      const TAG_PREFIX = "tag: ";

      // Since there might be multiple tags referenced by the same commit,
      // we need to treat all of them as a list.
      this.tags = refName
        .split(", ")
        .filter(ref => ref.startsWith(TAG_PREFIX))
        .map(ref => ref.substr(TAG_PREFIX.length));
    }
  }

  public async fillInIssue() {
    const issueNumber = await Commit.ApiClient.getIssueNumber(this);
    if (issueNumber) {
      this.issue = await Commit.ApiClient.getIssue(issueNumber);
    }
  }

  public fillInCategories() {
    if (!this.issue || !this.issue.labels) return;
    const labels = this.issue.labels.map(label => label.toLowerCase());
    this.categories = Object.keys(Commit.config.labels)
      .filter(label => labels.indexOf(label.toLowerCase()) !== -1)
      .map(label => Commit.config.labels[label]);
  }

  public async fillInPackages() {
    this.packages = await this.getListOfUniquePackages(this.commitSHA);
  }

  private async getListOfUniquePackages(sha: string) {
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
}

function onlyUnique(value: any, index: number, self: any[]): boolean {
  return self.indexOf(value) === index;
}
