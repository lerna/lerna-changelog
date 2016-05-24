import progressBar from "lerna/lib/progressBar";
import LernaRepo   from "lerna/lib/Repository";
import RemoteRepo  from "./RemoteRepo";
import execSync    from "./execSync";
import chalk       from "chalk";

function getLastTag() {
  return execSync("git describe --abbrev=0 --tags");
}

function getListOfCommits() {
  var lastTag = getLastTag();
  var commits = execSync("git log --first-parent --oneline " + lastTag + "..").split("\n");
  return commits;
}

function getCommiters(commits) {
  var committers = commits.map(function(commit) {
    return commit.user && commit.user.login;
  });

  return committers.filter(function(item, pos) {
    return item && committers.indexOf(item) === pos;
  });
}

function getCommitInfo(remote, commits) {
  progressBar.init(commits.length);

  var logs = commits.map(function(commit) {

    var sha = commit.slice(0, 7);
    var message = commit.slice(8);
    var response;
    progressBar.tick(sha);

    var mergeCommit = message.match(/\(#\d{4}\)$/);

    if (message.indexOf("Merge pull request ") === 0) {
      var start = message.indexOf("#") + 1;
      var end = message.slice(start).indexOf(" ");
      var issueNumber = message.slice(start, start + end);

      response = JSON.parse(remote.getIssueData(issueNumber));
      response.commitSHA = sha;
      response.mergeMessage = message;
      return response;
    } else if (mergeCommit) {
      var issueNumber = mergeCommit[0].slice(2, 6);
      response = JSON.parse(remote.getIssueData(issueNumber));
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

function getCommitsByCategory(remote, logs) {
  var categories = remote.getLabels().map(function(label) {
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
      heading: remote.getHeadingForLabel(label),
      commits: commits
    };
  });

  return categories;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(text){
      return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
    });
}

function createMarkdown(remote, commitsByCategory) {
  var date = new Date().toISOString();
  date = date.slice(0, date.indexOf("T"));

  var fixesRegex = /Fix(es)? ([T#]\d+)/i;

  var markdown = "\n";

  markdown += "## Unreleased (" + date + ")";

  progressBar.init(commitsByCategory.length);

  commitsByCategory.filter(function(category) {
    return category.commits.length > 0;
  }).forEach(function(category) {
    progressBar.tick(category.heading);

    markdown += "\n";
    markdown += "\n";
    markdown += "#### " + category.heading;

    category.commits.forEach(function(commit) {
      markdown += "\n";

      console.log(commit);

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

      console.log(changedPackages);

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
        var prUrl = remote.getBasePullRequestUrl() + commit.number;
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

  return markdown;
}

function repeat(str, times) {
  return Array(times + 1).join(str);
}

exports.description = "Create a changelog";


exports.execute = function () {
  if (!process.env.GITHUB_AUTH) {
    console.log(chalk.red("Must provide GITHUB_AUTH"));
    process.exit(1);
  }

  var config = new LernaRepo().lernaJson.changelog;

  var remote = new RemoteRepo(config);

  var commits = getListOfCommits();
  var commitInfo = getCommitInfo(remote, commits);

  console.log(commitInfo);

  var committers = getCommiters(commitInfo);
  var commitsByCategory = getCommitsByCategory(remote, commitInfo);
  var changelog = createMarkdown(remote, commitsByCategory);

  console.log(changelog);

  console.log("");
  console.log("#### Commiters: " + committers.length);
  console.log(committers.sort().map(function(commiter) {
    return "- " + commiter;
  }).join("\n"));
  console.log("");

  process.exit();
};
