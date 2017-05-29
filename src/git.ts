const execa = require("execa");

import execSync from "./exec-sync";

export async function changedPaths(sha: string): Promise<string[]> {
  const result = await execa("git", ["show", "-m", "--name-only" ,"--pretty=format:", "--first-parent", sha]);
  return result.stdout.split("\n");
}

/**
 * All existing tags in the repository
 */
export function listTagNames(): string[] {
  return execSync("git tag").split("\n").filter(Boolean);
}

/**
 * The latest reachable tag starting from HEAD
 */
export function lastTag(): string {
  return execSync("git describe --abbrev=0 --tags");
}

export interface CommitListItem {
  sha: string;
  refName: string;
  summary: string;
  date: string;
}

export function listCommits(from: string, to: string = ""): CommitListItem[] {
  // Prints "<short-hash>;<ref-name>;<summary>;<date>"
  // This format is used in `getCommitInfos` for easily analize the commit.
  return execSync(`git log --oneline --pretty="%h;%D;%s;%cd" --date=short ${from}..${to}`)
    .split("\n")
    .filter(Boolean)
    .map((commit: string) => {
      const parts = commit.split(";");
      const sha = parts[0];
      const refName = parts[1];
      const summary = parts[2];
      const date = parts[3];
      return { sha, refName, summary, date };
    });
}
