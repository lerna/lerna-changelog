import LernaRepo          from "lerna/lib/Repository";
import progressBar        from "lerna/lib/progressBar";
import RemoteRepo         from "./RemoteRepo";
import execSync           from "./execSync";
import ConfigurationError from "./ConfigurationError";

export default class Changelog {
  constructor(config) {
    this.config = this.getConfig();
    this.remote = new RemoteRepo(this.config);
  }

  getConfig() {
    const lerna = new LernaRepo();

    const config = lerna.lernaJson.changelog;

    if (!config) {
      throw new ConfigurationError(
        "Missing changelog config in `lerna.json`.\n"+
        "See docs for setup: https://github.com/lerna/lerna-changelog#readme"
      );
    }

    config.rootPath = lerna.rootPath;

    return config;
  }

  createMarkdown() {
    const commitInfo = this.getCommitInfo();
    const committers = this.getCommitters(commitInfo);
    const commitsByCategory = this.getCommitsByCategory(commitInfo);
    const fixesRegex = /(fix|close|resolve)(e?s|e?d)? [T#](\d+)/i;

    let date = new Date().toISOString();

    date = date.slice(0, date.indexOf("T"));

    let markdown = "\n";

    markdown += "## Unreleased (" + date + ")";

    progressBar.init(commitsByCategory.length);

    commitsByCategory.filter(category => {
      return category.commits.length > 0;
    }).forEach(category => {
      progressBar.tick(category.heading);

      const commitsByPackage = {};

      category.commits.forEach(commit => {

        // Array of unique packages.
        var changedPackages = Object.keys(
          execSync("git show -m --name-only --pretty='format:' --first-parent " + commit.commitSHA)
          // turn into an array
          .split("\n")
          // extract base package name, and stuff into an object for deduping.
          .reduce(function(obj, files) {
            if (files.indexOf("packages/") === 0) {
              obj[files.slice(9).split("/", 1)[0]] = true;
            }
            return obj;
          }, {})
        );

        const heading = changedPackages.length > 0
          ?"* "+changedPackages.map(pkg => "`" + pkg + "`").join(", ")
          :"* Other"; // No changes to packages, but still relevant.

        if (!commitsByPackage[heading]) {
          commitsByPackage[heading] = [];
        }

        commitsByPackage[heading].push(commit);
      });

      markdown += "\n";
      markdown += "\n";
      markdown += "#### " + category.heading;

      Object.keys(commitsByPackage).forEach(heading => {
        markdown += "\n"+heading;

        commitsByPackage[heading].forEach(commit => {

          markdown += "\n  * ";

          if (commit.number) {
            var prUrl = this.remote.getBasePullRequestUrl() + commit.number;
            markdown += "[#" + commit.number + "](" + prUrl + ") ";
          }


          if (commit.title.match(fixesRegex)) {
            commit.title = commit.title.replace(fixesRegex, "Closes [#$3](" + this.remote.getBaseIssueUrl() + "$3)");
          }

          markdown += commit.title + "." + " ([@" + commit.user.login + "](" + commit.user.html_url + "))";
        });
      });
    });

    progressBar.terminate();

    markdown += "\n\n#### Committers: " + committers.length + "\n";
    markdown += committers.map(function(commiter) {
      return "- " + commiter;
    }).join("\n");

    return markdown;
  }

  getLastTag() {
    return execSync("git describe --abbrev=0 --tags");
  }

  getListOfCommits() {
    var lastTag = this.getLastTag();
    var commits = execSync("git log --oneline " + lastTag + "..").split("\n");
    return commits;
  }

  getCommitters(commits) {
    var committers = {}

    commits.forEach(commit => {
      const login = (commit.user||{}).login;
      if (login && !committers[login]){
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

  getCommitInfo() {
    const commits = this.getListOfCommits();

    progressBar.init(commits.length);

    var logs = commits.map(commit => {

      var sha = commit.slice(0, 7);
      var message = commit.slice(8);
      var response;
      progressBar.tick(sha);

      var mergeCommit = message.match(/\(#(\d+)\)$/);

      if (message.indexOf("Merge pull request ") === 0) {
        var start = message.indexOf("#") + 1;
        var end = message.slice(start).indexOf(" ");
        var issueNumber = message.slice(start, start + end);

        response = this.remote.getIssueData(issueNumber);
        response.commitSHA = sha;
        response.mergeMessage = message;
        return response;
      } else if (mergeCommit) {
        var issueNumber = mergeCommit[1];
        response = this.remote.getIssueData(issueNumber);
        response.commitSHA = sha;
        response.mergeMessage = message;
        return response;
      }

      return {
        commitSHA: sha,
        message: message,
        labels: []
      };
    });

    progressBar.terminate();
    return logs;
  }

  getCommitsByCategory(logs) {
    var categories = this.remote.getLabels().map(label => {
      var commits = [];

      logs.forEach(function(log) {
        var labels = log.labels.map(function(label) {
          return label.name;
        });

        if (labels.indexOf(label.toLowerCase()) >= 0) {
          commits.push(log);
        }
      });

      return {
        heading: this.remote.getHeadingForLabel(label),
        commits: commits
      };
    });

    return categories;
  }
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(text){
      return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
    });
}
