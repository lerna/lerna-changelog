import LernaRepo from "lerna/lib/Repository";
import progressBar from "lerna/lib/progressBar";
import RemoteRepo from "./RemoteRepo";
import execSync from "./execSync";
import ConfigurationError from "./ConfigurationError";

const UNRELEASED_TAG = "___unreleased___";
const COMMIT_FIX_REGEX = /(fix|close|resolve)(e?s|e?d)? [T#](\d+)/i;

export default class Changelog {
  constructor(options = {}) {
    this.config = this.getConfig();
    this.remote = new RemoteRepo(this.config);

    // CLI options
    this.tagFrom = options.tagFrom;
    this.tagTo = options.tagTo;
  }

  getConfig() {
    const lerna = new LernaRepo();

    const config = lerna.lernaJson.changelog;

    if (!config) {
      throw new ConfigurationError(
        "Missing changelog config in `lerna.json`.\n" +
          "See docs for setup: https://github.com/lerna/lerna-changelog#readme"
      );
    }

    config.rootPath = lerna.rootPath;

    return config;
  }

  createMarkdown() {
    let markdown = "\n";

    // Get all info about commits in a certain tags range
    const commitsInfo = this.getCommitsInfo();
    const commitsByTag = this.getCommitsByTag(commitsInfo);

    Object.keys(commitsByTag).forEach(tag => {
      const commitsForTag = commitsByTag[tag].commits;

      const releaseTitle = tag === UNRELEASED_TAG ? "Unreleased" : tag;
      markdown += "## " + releaseTitle + " (" + commitsByTag[tag].date + ")";

      const committers = this.getCommitters(commitsForTag);
      const commitsByCategory = this.getCommitsByCategory(commitsForTag);

      progressBar.init(commitsByCategory.length);

      commitsByCategory
        .filter(category => category.commits.length > 0)
        .forEach(category => {
          progressBar.tick(category.heading);

          const commitsByPackage = category.commits.reduce(
            (acc, commit) => {
              // Array of unique packages.
              const changedPackages = this.getListOfUniquePackages();

              const heading = changedPackages.length > 0
                ? "* " + changedPackages.map(pkg => "`" + pkg + "`").join(", ")
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

          Object.keys(commitsByPackage).forEach(heading => {
            markdown += "\n" + heading;

            commitsByPackage[heading].forEach(commit => {
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
      markdown += committers.map(function(commiter) {
        return "- " + commiter;
      }).join("\n");
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

  getLastTag() {
    return execSync("git describe --abbrev=0 --tags");
  }

  getListOfCommits() {
    // Determine the tags range to get the commits for. Custom from/to can be
    // provided via command-line options.
    // Default is "from last tag".
    const tagFrom = this.tagFrom || this.getLastTag();
    const tagTo = this.tagTo || "";
    const tagsRange = tagFrom + ".." + tagTo;
    const commits = execSync(
      // Prints "<short-hash>;<ref-name>;<summary>;<date>"
      // This format is used in `getCommitsInfo` for easily analize the commit.
      'git log --oneline --pretty="%h;%D;%s;%cd" --date=short ' + tagsRange
    );
    if (commits) {
      return commits.split("\n");
    }
    return [];
  }

  getCommitters(commits) {
    const committers = {};

    commits.forEach(commit => {
      const login = (commit.user || {}).login;
      // If a list of `ignoreCommitters` is provided in the lerna.json config
      // check if the current committer should be kept or not.
      const shouldKeepCommiter = login && (
        !this.config.ignoreCommitters ||
        !this.config.ignoreCommitters.some(
          c => c === login || login.indexOf(c) > -1
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

    return Object.keys(committers).map(k => committers[k]).sort();
  }

  getCommitsInfo() {
    const commits = this.getListOfCommits();

    progressBar.init(commits.length);

    const commitsInfo = commits.map(commit => {
      // commit is formatted as following:
      // <short-hash>;<ref-name>;<summary>;<date>
      const parts = commit.split(";");
      const sha = parts[0];
      const _refs = parts[1].split(",");
      let tag;
      if (_refs.length === 1) {
        // "tag: <tag-name>
        tag = _refs[0].replace(/tag:\s(.*?)$/, "$1").trim();
      } else if (_refs.length === 4) {
        // "HEAD -> master, tag: <tag-name>, origin/master, origin/HEAD"
        tag = _refs[1].replace(/tag:\s(.*?)$/, "$1").trim();
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
        tag,
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

        const response = this.remote.getIssueData(issueNumber);
        response.commitSHA = sha;
        response.mergeMessage = message;
        Object.assign(commitInfo, response);
      }

      return commitInfo;
    });

    progressBar.terminate();
    return commitsInfo;
  }

  getCommitsByTag(commits) {
    // Analyze the commits and group them by tag.
    // This is useful to generate multiple release logs in case there are
    // multiple release tags.
    let currentTag = UNRELEASED_TAG;
    return commits.reduce(
      (acc, commit) => {
        const tag = commit.tag;
        if (tag) {
          currentTag = tag;
        }

        let existingCommitsForTag = [];
        if ({}.hasOwnProperty.call(acc, currentTag)) {
          existingCommitsForTag = acc[currentTag].commits;
        }

        let releaseDate = this.getToday();
        if (currentTag !== UNRELEASED_TAG) {
          releaseDate = acc[currentTag] ? acc[currentTag].date : commit.date;
        }

        return {
          ...acc,
          [currentTag]: {
            date: releaseDate,
            commits: existingCommitsForTag.concat(commit)
          }
        };
      },
      {}
    );
  }

  getCommitsByCategory(commits) {
    return this.remote.getLabels().map(
      label => ({
        heading: this.remote.getHeadingForLabel(label),
        // Keep only the commits that have a matching label with the one
        // provided in the lerna.json config.
        commits: commits.reduce(
          (acc, commit) => {
            if (
              commit.labels.some(
                l => l.name.toLowerCase() === label.toLowerCase()
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
