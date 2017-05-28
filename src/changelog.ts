const pMap = require("p-map");

import progressBar        from "./progress-bar";
import RemoteRepo         from "./remote-repo";
import execSync           from "./exec-sync";
import * as Configuration from "./configuration";
import findPullRequestId  from "./find-pull-request-id";

const UNRELEASED_TAG = "___unreleased___";
const COMMIT_FIX_REGEX = /(fix|close|resolve)(e?s|e?d)? [T#](\d+)/i;

interface CommitListItem {
  sha: string;
  refName: string;
  summary: string;
  date: string;
}

interface CommitInfo {
  number?: number;
  title?: string;
  pull_request?: {
    html_url: string;
  },
  commitSHA: string;
  message: string;
  labels: any[];
  tags?: string[];
  date: string;
  user?: any;
}

interface TagInfo {
  date: string;
  commits: CommitInfo[];
}

interface CategoryInfo {
  heading: string | undefined;
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

  async createMarkdown() {
    let markdown = "\n";

    // Get all info about commits in a certain tags range
    const commitsInfo = await this.getCommitInfos();
    const commitsByTag = await this.getCommitsByTag(commitsInfo);

    for (const tag of Object.keys(commitsByTag)) {
      const commitsForTag = commitsByTag[tag].commits;
      const commitsByCategory = this.getCommitsByCategory(commitsForTag);
      const committers = await this.getCommitters(commitsForTag);

      // Skip this iteration if there are no commits available for the tag
      const hasCommitsForCurrentTag = commitsByCategory.some(
        (category) => category.commits.length > 0
      );
      if (!hasCommitsForCurrentTag) continue;

      const releaseTitle = tag === UNRELEASED_TAG ? "Unreleased" : tag;
      markdown += `## ${releaseTitle} (${commitsByTag[tag].date})`;

      progressBar.init(commitsByCategory.length);

      const categoriesWithCommits = commitsByCategory
        .filter((category) => category.commits.length > 0);

      for (const category of categoriesWithCommits) {
        progressBar.tick(category.heading || "Other");

        const commitsByPackage: { [id: string]: CommitInfo[] } = category.commits.reduce((acc: { [id: string]: CommitInfo[] }, commit) => {
          // Array of unique packages.
          const changedPackages = this.getListOfUniquePackages(commit.commitSHA);

          const heading = changedPackages.length > 0
            ? `* ${changedPackages.map((pkg) => `\`${pkg}\``).join(", ")}`
            : "* Other";

          acc[heading] = acc[heading] || [];
          acc[heading].push(commit);

          return acc;
        }, {});

        markdown += "\n";
        markdown += "\n";
        markdown += `#### ${category.heading}`;

        const headings = Object.keys(commitsByPackage);
        const onlyOtherHeading = headings.length === 1 && headings[0] === "* Other";

        for (const heading of headings) {
          const commits = commitsByPackage[heading];

          if (!onlyOtherHeading) {
            markdown += `\n${heading}`;
          }

          for (const commit of commits) {
            markdown += onlyOtherHeading ? "\n* " : "\n  * ";

            if (commit.number && commit.pull_request && commit.pull_request.html_url) {
              const prUrl = commit.pull_request.html_url;
              markdown += `[#${commit.number}](${prUrl}) `;
            }

            if (commit.title && commit.title.match(COMMIT_FIX_REGEX)) {
              commit.title = commit.title.replace(
                COMMIT_FIX_REGEX,
                `Closes [#$3](${this.remote.getBaseIssueUrl()}$3)`
              );
            }

            markdown += `${commit.title}. ([@${commit.user.login}](${commit.user.html_url}))`;
          }
        }
      }

      progressBar.terminate();

      markdown += `\n\n#### Committers: ${committers.length}\n`;
      markdown += committers.map((commiter) => `- ${commiter}`).join("\n");
      markdown += "\n\n\n";
    }

    return markdown.substring(0, markdown.length - 3);
  }

  getListOfUniquePackages(sha: string): string[] {
    return execSync(`git show -m --name-only --pretty='format:' --first-parent ${sha}`)
      .map((path: string) => path.indexOf("packages/") === 0 ? path.slice(9).split("/", 1)[0] : "")
      .filter(Boolean)
      .filter(onlyUnique);
  }

  async getListOfTags(): Promise<string[]> {
    const tags = execSync("git tag");
    if (tags) {
      return tags.split("\n");
    }
    return [];
  }

  async getLastTag() {
    return execSync("git describe --abbrev=0 --tags");
  }

  async getListOfCommits(): Promise<CommitListItem[]> {
    // Determine the tags range to get the commits for. Custom from/to can be
    // provided via command-line options.
    // Default is "from last tag".
    const tagFrom = this.tagFrom || (await this.getLastTag());
    const tagTo = this.tagTo || "";
    const tagsRange = tagFrom + ".." + tagTo;
    const commits = execSync(
      // Prints "<short-hash>;<ref-name>;<summary>;<date>"
      // This format is used in `getCommitInfos` for easily analize the commit.
      `git log --oneline --pretty="%h;%D;%s;%cd" --date=short ${tagsRange}`
    );
    if (commits) {
      return commits.split("\n").map((commit: string) => {
        const parts = commit.split(";");
        const sha = parts[0];
        const refName = parts[1];
        const summary = parts[2];
        const date = parts[3];
        return { sha, refName, summary, date };
      });
    }
    return [];
  }

  async getCommitters(commits: CommitInfo[]): Promise<string[]> {
    const committers: { [id: string]: string } = {};

    for (const commit of commits) {
      const login = (commit.user || {}).login;
      // If a list of `ignoreCommitters` is provided in the lerna.json config
      // check if the current committer should be kept or not.
      const shouldKeepCommiter = login && (
        !this.config.ignoreCommitters ||
        !this.config.ignoreCommitters.some(
          (c: string) => c === login || login.indexOf(c) > -1
        )
      );
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

  async getCommitInfos(): Promise<CommitInfo[]> {
    const commits = await this.getListOfCommits();
    const allTags = await this.getListOfTags();

    progressBar.init(commits.length);

    const commitInfos = await pMap(commits, async (commit: CommitListItem) => {
      const { sha, refName, summary: message, date } = commit;

      let tagsInCommit;
      if (refName.length > 1) {
        // Since there might be multiple tags referenced by the same commit,
        // we need to treat all of them as a list.
        tagsInCommit = allTags.filter(tag => refName.indexOf(tag) !== -1);
      }

      progressBar.tick(sha);

      let commitInfo: CommitInfo = {
        commitSHA: sha,
        message: message,
        // Note: Only merge commits or commits referencing an issue / PR
        // will be kept in the changelog.
        labels: [],
        tags: tagsInCommit,
        date
      };

      const issueNumber = findPullRequestId(message);
      if (issueNumber !== null) {
        const response = await this.remote.getIssueData(issueNumber);
        commitInfo = {
          ...commitInfo,
          ...response,
          commitSHA: sha,
          mergeMessage: message,
        };
      }

      return commitInfo;
    }, { concurrency: 5 });

    progressBar.terminate();
    return commitInfos;
  }

  async getCommitsByTag(commits: CommitInfo[]): Promise<{ [id: string]: TagInfo }> {
    // Analyze the commits and group them by tag.
    // This is useful to generate multiple release logs in case there are
    // multiple release tags.
    let currentTags = [UNRELEASED_TAG];
    return commits.reduce((acc: any, commit) => {
      if (commit.tags && commit.tags.length > 0) {
        currentTags = commit.tags;
      }

      // Tags referenced by commits are treated as a list. When grouping them,
      // we split the commits referenced by multiple tags in their own group.
      // This results in having one group of commits for each tag, even if
      // the same commits are "duplicated" across the different tags
      // referencing them.
      const commitsForTags: any = {};
      for (const currentTag of currentTags) {
        let existingCommitsForTag = [];
        if ({}.hasOwnProperty.call(acc, currentTag)) {
          existingCommitsForTag = acc[currentTag].commits;
        }

        let releaseDate = this.getToday();
        if (currentTag !== UNRELEASED_TAG) {
          releaseDate = acc[currentTag] ? acc[currentTag].date : commit.date;
        }

        commitsForTags[currentTag] = {
          date: releaseDate,
          commits: existingCommitsForTag.concat(commit)
        };
      }

      return {
        ...acc,
        ...commitsForTags,
      };
    }, {});
  }

  getCommitsByCategory(allCommits: CommitInfo[]): CategoryInfo[] {
    return this.remote.getLabels().map((label) => {
      let heading = this.remote.getHeadingForLabel(label);

      // Keep only the commits that have a matching label with the one
      // provided in the lerna.json config.
      let commits = allCommits
        .filter((commit) => commit.labels.some((l: any) => l.name.toLowerCase() === label.toLowerCase()));

      return { heading, commits };
    });
  }

  getToday() {
    const date = new Date().toISOString();
    return date.slice(0, date.indexOf("T"));
  }
}

function onlyUnique(value: any, index: number, self: any[]): boolean {
  return self.indexOf(value) === index;
}
