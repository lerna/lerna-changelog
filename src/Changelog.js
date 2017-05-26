import progressBar        from "./progressBar";
import RemoteRepo         from "./RemoteRepo";
import execSync           from "./execSync";
import * as Configuration from "./Configuration";

const UNRELEASED_TAG = "___unreleased___";
const COMMIT_FIX_REGEX = /(fix|close|resolve)(e?s|e?d)? [T#](\d+)/i;

export default class Changelog {
  constructor(options = {}) {
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
    const commitsInfo = await this.getCommitsInfo();
    const commitsByTag = await this.getCommitsByTag(commitsInfo);

    Object.keys(commitsByTag).forEach((tag) => {
      const commitsForTag = commitsByTag[tag].commits;
      const commitsByCategory = this.getCommitsByCategory(commitsForTag);
      const committers = this.getCommitters(commitsForTag);

      // Skip this iteration if there are no commits available for the tag
      const hasCommitsForCurrentTag = commitsByCategory.some(
        (category) => category.commits.length > 0
      );
      if (!hasCommitsForCurrentTag) return;

      const releaseTitle = tag === UNRELEASED_TAG ? "Unreleased" : tag;
      markdown += "## " + releaseTitle + " (" + commitsByTag[tag].date + ")";

      progressBar.init(commitsByCategory.length);

      commitsByCategory
        .filter((category) => category.commits.length > 0)
        .forEach((category) => {
          progressBar.tick(category.heading);

          const commitsByPackage = category.commits.reduce(
            (acc, commit) => {
              // Array of unique packages.
              const changedPackages =
                this.getListOfUniquePackages(commit.commitSHA);

              const heading = changedPackages.length > 0
                ? "* " + changedPackages.map((pkg) => "`" + pkg + "`").join(", ")
                : "* Other";
              // No changes to packages, but still relevant.
              const existingCommitsForHeading = acc[heading] || [];
              return {
                ...acc,
                [heading]: existingCommitsForHeading.concat(commit)
              };
            },
            {}
          );

          markdown += "\n";
          markdown += "\n";
          markdown += "#### " + category.heading;

          Object.keys(commitsByPackage).forEach((heading) => {
            markdown += "\n" + heading;

            commitsByPackage[heading].forEach((commit) => {
              markdown += "\n  * ";

              if (commit.number) {
                const prUrl = this.remote.getBasePullRequestUrl() +
                  commit.number;
                markdown += "[#" + commit.number + "](" + prUrl + ") ";
              }

              if (commit.title.match(COMMIT_FIX_REGEX)) {
                commit.title = commit.title.replace(
                  COMMIT_FIX_REGEX,
                  "Closes [#$3](" + this.remote.getBaseIssueUrl() + "$3)"
                );
              }

              markdown += commit.title + "." + " ([@" + commit.user.login +
                "](" +
                commit.user.html_url +
                "))";
            });
          });
        });

      progressBar.terminate();

      markdown += "\n\n#### Committers: " + committers.length + "\n";
      markdown += committers.map((commiter) => "- " + commiter).join("\n");
      markdown += "\n\n\n";
    });

    return markdown.substring(0, markdown.length - 3);
  }

  getListOfUniquePackages(sha) {
    return Object.keys(
      // turn into an array
      execSync(
        "git show -m --name-only --pretty='format:' --first-parent " + sha
      )
      .split("\n")
      .reduce((acc, files) => {
        if (files.indexOf("packages/") === 0) {
          acc[files.slice(9).split("/", 1)[0]] = true;
        }
        return acc;
      }, {})
    );
  }

  async getListOfTags() {
    const tags = execSync("git tag");
    if (tags) {
      return tags.split("\n");
    }
    return [];
  }

  async getLastTag() {
    return execSync("git describe --abbrev=0 --tags");
  }

  async getListOfCommits() {
    // Determine the tags range to get the commits for. Custom from/to can be
    // provided via command-line options.
    // Default is "from last tag".
    const tagFrom = this.tagFrom || (await this.getLastTag());
    const tagTo = this.tagTo || "";
    const tagsRange = tagFrom + ".." + tagTo;
    const commits = execSync(
      // Prints "<short-hash>;<ref-name>;<summary>;<date>"
      // This format is used in `getCommitsInfo` for easily analize the commit.
      "git log --oneline --pretty=\"%h;%D;%s;%cd\" --date=short " + tagsRange
    );
    if (commits) {
      return commits.split("\n");
    }
    return [];
  }

  getCommitters(commits) {
    const committers = {};

    commits.forEach((commit) => {
      const login = (commit.user || {}).login;
      // If a list of `ignoreCommitters` is provided in the lerna.json config
      // check if the current committer should be kept or not.
      const shouldKeepCommiter = login && (
        !this.config.ignoreCommitters ||
        !this.config.ignoreCommitters.some(
          (c) => c === login || login.indexOf(c) > -1
        )
      );
      if (login && shouldKeepCommiter && !committers[login]) {
        const user = this.remote.getUserData(login);
        const userNameAndLink = `[${login}](${user.html_url})`;
        if (user.name) {
          committers[login] = `${user.name} (${userNameAndLink})`;
        } else {
          committers[login] = userNameAndLink;
        }
      }
    });

    return Object.keys(committers).map((k) => committers[k]).sort();
  }

  async getCommitsInfo() {
    const commits = await this.getListOfCommits();
    const allTags = await this.getListOfTags();

    progressBar.init(commits.length);

    const commitsInfo = [];

    for (const commit of commits) {
      // commit is formatted as following:
      // <short-hash>;<ref-name>;<summary>;<date>
      const parts = commit.split(";");
      const sha = parts[0];
      const _refs = parts[1];
      let tagsInCommit;
      if (_refs.length > 1) {
        // Since there might be multiple tags referenced by the same commit,
        // we need to treat all of them as a list.
        tagsInCommit = allTags.reduce((acc, tag) => {
          if (_refs.indexOf(tag) < 0)
            return acc;
          return acc.concat(tag);
        }, []);
      }
      const message = parts[2];
      const date = parts[3];

      progressBar.tick(sha);

      const mergeCommit = message.match(/\(#(\d+)\)$/);

      const commitInfo = {
        commitSHA: sha,
        message: message,
        // Note: Only merge commits or commits referencing an issue / PR
        // will be kept in the changelog.
        labels: [],
        tags: tagsInCommit,
        date
      };

      if (message.indexOf("Merge pull request ") === 0 || mergeCommit) {
        let issueNumber;
        if (message.indexOf("Merge pull request ") === 0) {
          const start = message.indexOf("#") + 1;
          const end = message.slice(start).indexOf(" ");
          issueNumber = message.slice(start, start + end);
        } else
          issueNumber = mergeCommit[1];

        const response = await this.remote.getIssueData(issueNumber);
        response.commitSHA = sha;
        response.mergeMessage = message;
        Object.assign(commitInfo, response);
      }

      commitsInfo.push(commitInfo);
    }

    progressBar.terminate();
    return commitsInfo;
  }

  async getCommitsByTag(commits) {
    // Analyze the commits and group them by tag.
    // This is useful to generate multiple release logs in case there are
    // multiple release tags.
    let currentTags = [UNRELEASED_TAG];
    return commits.reduce((acc, commit) => {
      if (commit.tags && commit.tags.length > 0) {
        currentTags = commit.tags;
      }

      // Tags referenced by commits are treated as a list. When grouping them,
      // we split the commits referenced by multiple tags in their own group.
      // This results in having one group of commits for each tag, even if
      // the same commits are "duplicated" across the different tags
      // referencing them.
      const commitsForTags = currentTags.reduce((acc2, currentTag) => {
        let existingCommitsForTag = [];
        if ({}.hasOwnProperty.call(acc, currentTag)) {
          existingCommitsForTag = acc[currentTag].commits;
        }

        let releaseDate = this.getToday();
        if (currentTag !== UNRELEASED_TAG) {
          releaseDate = acc[currentTag] ? acc[currentTag].date : commit.date;
        }

        return {
          ...acc2,
          [currentTag]: {
            date: releaseDate,
            commits: existingCommitsForTag.concat(commit)
          }
        };
      }, {});


      return {
        ...acc,
        ...commitsForTags,
      };
    }, {});
  }

  getCommitsByCategory(commits) {
    return this.remote.getLabels().map(
      (label) => ({
        heading: this.remote.getHeadingForLabel(label),
        // Keep only the commits that have a matching label with the one
        // provided in the lerna.json config.
        commits: commits.reduce(
          (acc, commit) => {
            if (
              commit.labels.some(
                (l) => l.name.toLowerCase() === label.toLowerCase()
              )
            )
              return acc.concat(commit);
            return acc;
          },
          []
        )
      })
    );
  }

  getToday() {
    const date = new Date().toISOString();
    return date.slice(0, date.indexOf("T"));
  }
}
