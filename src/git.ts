const execa = require("execa");

export async function changedPaths(sha: string): Promise<string[]> {
  const result = await execa("git", ["show", "-m", "--name-only", "--pretty=format:", "--first-parent", sha]);
  return result.stdout.split("\n");
}

/**
 * All existing tags in the repository
 */
export function listTagNames(): string[] {
  return execa
    .sync("git", ["tag"])
    .stdout.split("\n")
    .filter(Boolean);
}

/**
 * The latest reachable tag starting from HEAD
 */
export function lastTag(): string {
  return execa.sync("git", ["describe", "--abbrev=0", "--tags"]).stdout;
}

export interface CommitListItem {
  sha: string;
  refName: string;
  summary: string;
  date: string;
}

export function parseLogMessage(commit: string): CommitListItem | null {
  const parts = commit.match(/hash<(.+)> ref<(.*)> message<(.*)> date<(.*)>/) || [];

  if (!parts || parts.length === 0) {
    return null;
  }

  return {
    sha: parts[1],
    refName: parts[2],
    summary: parts[3],
    date: parts[4],
  };
}

export function listCommits(from: string, to: string = ""): CommitListItem[] {
  // Prints "hash<short-hash> ref<ref-name> message<summary> date<date>"
  // This format is used in `getCommitInfos` for easily analize the commit.
  let listCommits = execa
    .sync("git", [
      "log",
      "--oneline",
      "--pretty=hash<%h> ref<%D> message<%s> date<%cd>",
      "--date=short",
      `${from}..${to}`,
    ])
    .stdout.split("\n")
    .filter(Boolean)
    .map(parseLogMessage)
    .filter(Boolean);

  const existsBranch = !!execa
    .sync("git", ["branch", "--list", `release/${from}`])
    .stdout;

  if (existsBranch) {
    const cherryPickedCommitTitles = execa
      .sync("git", ["reflog", `release/${from}`])
      .stdout.split("\n")
      .filter((commit: string) => commit.match(/cherry-pick: Merge pull request/))
      .map((commit: { match: (arg0: RegExp) => any[]; }) => commit.match(/Merge pull request [^\s]+/)[0]);

    listCommits = listCommits.filter((commit: { summary: string; }) => {
      for (var title of cherryPickedCommitTitles) {
          if (commit.summary.includes(title)) {
            return false;
          }
      }
      return true;
    })
  }

  return listCommits;
}
