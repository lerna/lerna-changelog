jest.mock("../src/progress-bar");
jest.mock("../src/api-data-cache");
jest.mock("../src/changelog");
jest.mock("../src/github-api");
jest.mock("../src/exec-sync");

describe("Changelog", () => {
  describe("contructor", () => {
    const MockedChangelog = require("./changelog").default;

    beforeEach(() => {
      require("./changelog").__resetDefaults();
    });

    it("set config", () => {
      const testConfig = require("./changelog").__getConfig();

      const changelog = new MockedChangelog();
      expect(changelog.config).toEqual(testConfig);
    });

    it("set remote", () => {
      const changelog = new MockedChangelog();
      expect(changelog.remote).toBeDefined();
    });

    it("set cli options", () => {
      const changelog = new MockedChangelog({ "tag-from": "1", "tag-to": "2" });
      expect(changelog.tagFrom).toBe("1");
      expect(changelog.tagTo).toBe("2");
    });
  });

  describe("getCommitInfos", () => {
    beforeEach(() => {
      require("./exec-sync").__resetDefaults();
      require("./api-data-cache").__resetDefaults();

      require("./exec-sync").__mockGitLog(
        "a0000005;HEAD -> master, tag: v0.2.0, origin/master, " +
        "origin/HEAD;chore(release): releasing component;2017-01-01\n" +
        "a0000004;;Merge pull request #2 from my-feature;2017-01-01\n" +
        "a0000003;;feat(module) Add new module (#2);2017-01-01\n" +
        "a0000002;;refactor(module) Simplify implementation;2017-01-01\n" +
        "a0000001;tag: v0.1.0;chore(release): releasing component;2017-01-01"
      );
      require("./exec-sync").__mockGitTag(
        "v0.2.0\n" +
        "v0.1.1\n" +
        "v0.1.0\n" +
        "v0.0.1"
      );
      const usersCache = {
        "test-user": {
          login: "test-user",
          html_url: "https://github.com/test-user",
          name: "Test User"
        },
      };
      const issuesCache = {
        2: {
          number: 2,
          title: "This is the commit title for the issue (#2)",
          labels: [
            { name: "Type: New Feature" },
            { name: "Status: In Progress" },
          ],
          user: usersCache["test-user"],
        }
      };
      require("./api-data-cache").__setCache({
        users: usersCache,
        "repos/lerna/lerna-changelog/issues": issuesCache,
      });
    });

    it("parse commits with different tags", async () => {
      const MockedChangelog = require("./changelog").default;
      const changelog = new MockedChangelog();
      const commitsInfo = await changelog.getCommitInfos();

      expect(commitsInfo).toEqual([
        {
          commitSHA: "a0000005",
          date: "2017-01-01",
          message: "chore(release): releasing component",
          tags: ["v0.2.0"],
          issueNumber: null,
        },
        {
          commitSHA: "a0000004",
          date: "2017-01-01",
          message: "Merge pull request #2 from my-feature",
          tags: undefined,
          issueNumber: "2",
          githubIssue: {
            labels: [
              { name: "Type: New Feature" },
              { name: "Status: In Progress" },
            ],
            number: 2,
            title: "This is the commit title for the issue (#2)",
            user: {
              html_url: "https://github.com/test-user",
              login: "test-user",
              name: "Test User",
            },
          },
        },
        {
          commitSHA: "a0000003",
          date: "2017-01-01",
          message: "feat(module) Add new module (#2)",
          tags: undefined,
          issueNumber: "2",
          githubIssue: {
            labels: [
              { name: "Type: New Feature" },
              { name: "Status: In Progress" },
            ],
            number: 2,
            title: "This is the commit title for the issue (#2)",
            user: {
              html_url: "https://github.com/test-user",
              login: "test-user",
              name: "Test User",
            },
          },
        },
        {
          commitSHA: "a0000002",
          date: "2017-01-01",
          message: "refactor(module) Simplify implementation",
          tags: undefined,
          issueNumber: null,
        },
        {
          commitSHA: "a0000001",
          date: "2017-01-01",
          message: "chore(release): releasing component",
          tags: ["v0.1.0"],
          issueNumber: null,
        },
      ]);
    });
  });

  describe("getCommitsByCategory", () => {
    it("group commits by category", () => {
      const MockedChangelog = require("./changelog").default;
      const changelog = new MockedChangelog();
      const testCommits = [
        { commitSHA: "a0000005", githubIssue: { labels: [{ name: "Status: In Progress" }] }},
        { commitSHA: "a0000004", githubIssue: { labels: [{ name: "Type: Bug" }] }},
        {
          commitSHA: "a0000003",
          githubIssue: {
            labels: [
              { name: "Type: New Feature" },
              { name: "Status: In Progress" },
            ]
          }
        },
        { commitSHA: "a0000002", githubIssue: { labels: [] }},
        { commitSHA: "a0000001", githubIssue: { labels: [] }}
      ];
      const commitsByCategory = changelog.getCommitsByCategory(testCommits);

      expect(commitsByCategory).toEqual([
        {
          commits: [
            {
              commitSHA: "a0000003",
              githubIssue: {
                labels: [
                  { name: "Type: New Feature" },
                  { name: "Status: In Progress" }
                ]
              }
            }
          ],
          heading: ":rocket: New Feature"
        },
        { commits: [], heading: ":boom: Breaking Change" },
        {
          commits: [
            {
              commitSHA: "a0000004",
              githubIssue: {
                labels: [{name: "Type: Bug"}]
              }
            }
          ],
          heading: ":bug: Bug Fix"
        },
        { commits: [], heading: ":nail_care: Enhancement" },
        { commits: [], heading: ":memo: Documentation" },
        { commits: [], heading: ":house: Maintenance" }
      ]);
    });
  });

  describe("getCommitters", () => {
    beforeEach(() => {
      require("./api-data-cache").__resetDefaults();

      const usersCache = {
        "test-user": {
          login: "test-user",
          html_url: "https://github.com/test-user",
          name: "Test User"
        },
        "test-user-1": {
          login: "test-user-1",
          html_url: "https://github.com/test-user-1",
          name: "Test User 1"
        },
        "test-user-2": {
          login: "test-user-2",
          html_url: "https://github.com/test-user-2",
          name: "Test User 2"
        },
        "user-bot": {
          login: "user-bot",
          html_url: "https://github.com/user-bot",
          name: "User Bot"
        },
      };
      require("./api-data-cache").__setCache({
        users: usersCache,
        "repos/lerna/lerna-changelog/issues": {},
      });
      require("./changelog").__setConfig({ ignoreCommitters: ["user-bot"] });
    });

    it("get list of valid commiters", async () => {
      const MockedChangelog = require("./changelog").default;
      const changelog = new MockedChangelog();

      const testCommits = [
        { commitSHA: "a0000004", githubIssue: { user: { login: "test-user-1" } } },
        { commitSHA: "a0000003", githubIssue: { user: { login: "test-user-2" } } },
        { commitSHA: "a0000002", githubIssue: { user: { login: "user-bot" } } },
        { commitSHA: "a0000001" },
      ];
      const committers = await changelog.getCommitters(testCommits);

      expect(committers).toEqual([
        "Test User 1 ([test-user-1](https://github.com/test-user-1))",
        "Test User 2 ([test-user-2](https://github.com/test-user-2))"
      ]);
    });
  });
});
