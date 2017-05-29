import progressBar from "./progress-bar";
import {GitHubUserResponse} from "./github-api";
import {CommitInfo, Release} from "./interfaces";

const UNRELEASED_TAG = "___unreleased___";
const COMMIT_FIX_REGEX = /(fix|close|resolve)(e?s|e?d)? [T#](\d+)/i;

interface CategoryInfo {
  name: string | undefined;
  commits: CommitInfo[];
}

interface Options {
  categories: string[];
  baseIssueUrl: string;
}

export default class MarkdownRenderer {
  private options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  renderMarkdown(releases: Release[]) {
    let markdown = "\n";

    for (const release of releases) {
      // Step 8: Group commits in release by category (local)
      const categories = this.groupByCategory(release.commits);
      const categoriesWithCommits = categories.filter((category) => category.commits.length > 0);

      // Skip this iteration if there are no commits available for the release
      if (categoriesWithCommits.length === 0) continue;

      const releaseTitle = release.name === UNRELEASED_TAG ? "Unreleased" : release.name;
      markdown += `## ${releaseTitle} (${release.date})`;

      progressBar.init(categories.length);

      for (const category of categoriesWithCommits) {
        progressBar.setTitle(category.name || "Other");

        // Step 9: Group commits in category by package (local)
        const commitsByPackage: { [id: string]: CommitInfo[] } = {};
        for (const commit of category.commits) {
          // Array of unique packages.
          const changedPackages = commit.packages || [];

          const heading = changedPackages.length > 0
            ? `* ${changedPackages.map((pkg) => `\`${pkg}\``).join(", ")}`
            : "* Other";

          commitsByPackage[heading] = commitsByPackage[heading] || [];
          commitsByPackage[heading].push(commit);
        }

        markdown += "\n";
        markdown += "\n";
        markdown += `#### ${category.name}`;

        const headings = Object.keys(commitsByPackage);
        const onlyOtherHeading = headings.length === 1 && headings[0] === "* Other";

        // Step 10: Print commits
        for (const heading of headings) {
          const commits = commitsByPackage[heading];

          if (!onlyOtherHeading) {
            markdown += `\n${heading}`;
          }

          for (const commit of commits) {
            const issue = commit.githubIssue;
            if (issue) {
              markdown += onlyOtherHeading ? "\n* " : "\n  * ";

              if (issue.number && issue.pull_request && issue.pull_request.html_url) {
                const prUrl = issue.pull_request.html_url;
                markdown += `[#${issue.number}](${prUrl}) `;
              }

              if (issue.title && issue.title.match(COMMIT_FIX_REGEX)) {
                issue.title = issue.title.replace(
                  COMMIT_FIX_REGEX,
                  `Closes [#$3](${this.options.baseIssueUrl}$3)`
                );
              }

              markdown += `${issue.title}. ([@${issue.user.login}](${issue.user.html_url}))`;
            }
          }
        }

        progressBar.tick();
      }

      progressBar.terminate();

      let contributors: GitHubUserResponse[] = release.contributors || [];
      markdown += `\n\n#### Committers: ${contributors.length}\n`;
      markdown += contributors.map((contributor) => {
        const userNameAndLink = `[${contributor.login}](${contributor.html_url})`;
        if (contributor.name) {
          return `- ${contributor.name} (${userNameAndLink})`;
        } else {
          return `- ${userNameAndLink}`;
        }
      }).sort().join("\n");
      markdown += "\n\n\n";
    }

    return markdown.substring(0, markdown.length - 3);
  }

  groupByCategory(allCommits: CommitInfo[]): CategoryInfo[] {
    return this.options.categories.map((name) => {
      // Keep only the commits that have a matching label with the one
      // provided in the lerna.json config.
      let commits = allCommits
        .filter((commit) => commit.categories && commit.categories.indexOf(name) !== -1);

      return { name, commits };
    });
  }
}
