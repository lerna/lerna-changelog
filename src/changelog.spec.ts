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

      expect(commitsInfo).toMatchSnapshot();
    });
  });

  describe("groupByCategory", () => {
    it("group commits by category", () => {
      const MockedChangelog = require("./changelog").default;
      const changelog = new MockedChangelog();
      const testCommits = [
        { commitSHA: "a0000005", categories: [] },
        { commitSHA: "a0000004", categories: [":bug: Bug Fix"] },
        { commitSHA: "a0000003", categories: [":rocket: New Feature"] },
        { commitSHA: "a0000002", categories: [] },
        { commitSHA: "a0000001", categories: [":bug: Bug Fix"] },
      ];
      const commitsByCategory = changelog.groupByCategory(testCommits);

      expect(commitsByCategory).toMatchSnapshot();
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

      expect(committers).toEqual([{
        login: "test-user-1",
        html_url: "https://github.com/test-user-1",
        name: "Test User 1"
      }, {
        login: "test-user-2",
        html_url: "https://github.com/test-user-2",
        name: "Test User 2"
      }]);
    });
  });
});
