import LernaRepo   from "lerna/lib/Repository";
import progressBar from "lerna/lib/progressBar";
import RemoteRepo  from "./RemoteRepo";
import execSync    from "./execSync";

export default class Changelog {
  constructor(config) {
    this.config = this.getConfig();
    this.remote = new RemoteRepo(this.config);
  }

  getConfig() {
    const lerna = new LernaRepo();

    const config = lerna.lernaJson.changelog;

    config.rootPath = lerna.rootPath;

    return config;
  }

  createMarkdown() {
    const commitInfo = this.getCommitInfo();
    const committers = this.getCommitters(commitInfo);
    const commitsByCategory = this.getCommitsByCategory(commitInfo);
    const fixesRegex = /Fix(es)? ([T#]\d+)/i;

    let date = new Date().toISOString();

    date = date.slice(0, date.indexOf("T"));

    let markdown = "\n";

    markdown += "## Unreleased (" + date + ")";

    progressBar.init(commitsByCategory.length);

    commitsByCategory.filter(category => {
      return category.commits.length > 0;
    }).forEach(category => {
      progressBar.tick(category.heading);

      markdown += "\n";
      markdown += "\n";
      markdown += "#### " + category.heading;

      category.commits.forEach(commit => {
        markdown += "\n";

        var changedPackages =
        execSync("git log -m --name-only --pretty='format:' " + commit.commitSHA)
        // not sure why it's including extra files
        .split("\n\n")[0]
        // turn into an array
        .split("\n")
        // remove files that aren't in packages/
        .filter(function(files) {
          return files.indexOf("packages/") >= 0;
        })
        // extract base package name
        .map(function(files) {
          files = files.slice(9);
          return files.slice(0, files.indexOf("/"));
        })
        // unique packages
        .filter(function(value, index, self) {
          return self.indexOf(value) === index;
        });

        var spaces = 0;

        if (changedPackages.length > 0) {
          markdown += repeat(" ", spaces) + "* ";

          changedPackages.forEach(function(pkg, i) {
            markdown += (i === 0 ? "" : ", ") + "`" + pkg + "`";
          });

          markdown += "\n";

          // indent more?
          spaces = 2;
        }

        if (commit.number) {
          var prUrl = this.remote.getBasePullRequestUrl() + commit.number;
          markdown += repeat(" ", spaces) + "* ";
          markdown += "[#" + commit.number + "](" + prUrl + ")";
        }


        if (commit.title.match(fixesRegex)) {
          commit.title = commit.title.replace(fixesRegex, "Fixes [$2](" + remote.getBaseIssueUrl() + "$2)");
        }

        markdown += " " + commit.title + "." + " ([@" + commit.user.login + "](" + commit.user.html_url + "))";
      });
    });

    progressBar.terminate();

    markdown += "\n\n#### Commiters: " + committers.length + "\n";
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
    var commits = execSync("git log --first-parent --oneline " + lastTag + "..").split("\n");
    return commits;
  }

  getCommitters(commits) {
    var committers = {}

    commits.forEach(function(commit) {
      if (!commit.user) return;
      const login = commit.user.login;
      const url = commit.user.html_url;
      if (login) {
        committers[login] = url?`[${login}](${commit.user.html_url})`:login;
      }
    });

    return Object.keys(committers).sort().map(k => committers[k]);
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

        response = JSON.parse(this.remote.getIssueData(issueNumber));
        response.commitSHA = sha;
        response.mergeMessage = message;
        return response;
      } else if (mergeCommit) {
        var issueNumber = mergeCommit[1];
        response = JSON.parse(this.remote.getIssueData(issueNumber));
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

function repeat(str, times) {
  return Array(times + 1).join(str);
}
