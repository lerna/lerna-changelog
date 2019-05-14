import { Commit } from "./commit";
import { CommitListItem, IRelease, User } from "./interfaces";
import * as Git from "./utils/git";

export function getListOfCommits(from: string, to: string): CommitListItem[] {
  // Determine the tags range to get the commits for. Custom from/to can be
  // provided via command-line options.
  // Default is "from last tag".
  return Git.listCommits(from, to);
}

const UNRELEASED_TAG = "___unreleased___";

export class Release implements IRelease {
  public static async getRelease(from: string, to: string): Promise<Release[]> {
    // Step 1: Get list of commits between tag A and B (local)
    // Get all info about commits in a certain tags range
    const commitItems = getListOfCommits(from, to);
    // Step 2 -> see Commit constructor
    const commits = commitItems.map(c => new Commit(c));

    // Step 3-5 -> see Commit.transpile
    await Commit.transpile(commits);

    // Step 6: Group commits by release (local)
    let currentTags = [UNRELEASED_TAG];

    // Tags referenced by commits are treated as a list. When grouping them,
    // we split the commits referenced by multiple tags in their own group.
    // This results in having one group of commits for each tag, even if
    // the same commits are "duplicated" across the different tags
    // referencing them.
    const releaseMap = commits.reduce(
      (pre, commit) => {
        if (commit.tags && commit.tags.length > 0) {
          currentTags = commit.tags;
        }
        currentTags.forEach(currentTag => {
          if (!pre[currentTag]) {
            let date = currentTag === UNRELEASED_TAG ? Release.getToday() : commit.date;
            pre[currentTag] = new Release(currentTag, date);
          }
          pre[currentTag].addCommit(commit);
        });
        return pre;
      },
      {} as { [id: string]: Release }
    );

    return Object.keys(releaseMap).map(tag => {
      // Step 7: Compile list of committers in release (local)
      releaseMap[tag].fillInContributors();
      return releaseMap[tag];
    });
  }

  private static getToday() {
    const date = new Date().toISOString();
    return date.slice(0, date.indexOf("T"));
  }

  public commits: Commit[] = [];
  public contributors: User[] = [];

  private constructor(public readonly name: string, public readonly date: string) {}

  private addCommit(commit: Commit) {
    this.commits.push(commit);
  }

  private fillInContributors() {
    const contributorsMap: { [login: string]: User } = {};
    this.commits.forEach(commit => {
      if (commit.issue && commit.issue.user && commit.issue.user.shouldKeepCommiter) {
        const user = commit.issue.user;
        contributorsMap[user.login] = user;
      }
    });
    this.contributors = Object.keys(contributorsMap).map(k => contributorsMap[k]);
  }
}
