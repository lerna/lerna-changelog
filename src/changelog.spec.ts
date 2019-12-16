jest.mock("../src/progress-bar");
jest.mock("../src/changelog");
jest.mock("../src/github-api");
jest.mock("./git");
jest.mock("./fetch");

describe("Changelog", () => {
  describe("packageFromPath", () => {
    const MockedChangelog = require("./changelog").default;

    const TESTS = [
      ["", ""],
      ["foo.js", ""],
      ["packages/foo.js", ""],
      ["packages/foo/bar.js", "foo"],
      ["packages/foo/bar/baz.js", "foo"],
      ["packages/@foo/bar.js", "@foo"],
      ["packages/@foo/bar/baz.js", "@foo/bar"],
    ];

    for (let [input, expected] of TESTS) {
      it(`${input} -> ${expected}`, () => {
        const changelog = new MockedChangelog();
        expect(changelog.packageFromPath(input)).toEqual(expected);
      });
    }
  });

  describe("getCommitInfos", () => {
    beforeEach(() => {
      require("./fetch").__resetMockResponses();

      require("./git").listCommits.mockImplementation(() => [
        {
          sha: "a0000005",
          refName: "HEAD -> master, tag: v0.2.0, origin/master, origin/HEAD",
          summary: "chore(release): releasing component",
          date: "2017-01-01",
        },
        {
          sha: "a0000004",
          refName: "",
          summary: "Merge pull request #2 from my-feature",
          date: "2017-01-01",
        },
        {
          sha: "a0000003",
          refName: "",
          summary: "feat(module) Add new module (#2)",
          date: "2017-01-01",
        },
        {
          sha: "a0000002",
          refName: "",
          summary: "refactor(module) Simplify implementation",
          date: "2017-01-01",
        },
        {
          sha: "a0000001",
          refName: "tag: v0.1.0",
          summary: "chore(release): releasing component",
          date: "2017-01-01",
        },
      ]);

      require("./git").listTagNames.mockImplementation(() => ["v0.2.0", "v0.1.1", "v0.1.0", "v0.0.1"]);

      require("./git").changedPaths.mockImplementation(() => []);

      const usersCache = {
        "https://api.github.com/users/test-user": {
          body: {
            login: "test-user",
            html_url: "https://github.com/test-user",
            name: "Test User",
          },
        },
      };
      const issuesCache = {
        "https://api.github.com/repos/lerna/lerna-changelog/issues/2": {
          body: {
            number: 2,
            title: "This is the commit title for the issue (#2)",
            labels: [{ name: "Type: New Feature" }, { name: "Status: In Progress" }],
            user: usersCache["https://api.github.com/users/test-user"].body,
          },
        },
      };
      require("./fetch").__setMockResponses({
        ...usersCache,
        ...issuesCache,
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("parse commits with different tags", async () => {
      const MockedChangelog = require("./changelog").default;
      const changelog = new MockedChangelog();
      const commitsInfo = await changelog.getCommitInfos();

      expect(commitsInfo).toMatchSnapshot();
    });
  });

  describe("getCommitters", () => {
    beforeEach(() => {
      require("./fetch").__resetMockResponses();

      const usersCache = {
        "https://api.github.com/users/test-user": {
          body: {
            login: "test-user",
            html_url: "https://github.com/test-user",
            name: "Test User",
          },
        },
        "https://api.github.com/users/test-user-1": {
          body: {
            login: "test-user-1",
            html_url: "https://github.com/test-user-1",
            name: "Test User 1",
          },
        },
        "https://api.github.com/users/test-user-2": {
          body: {
            login: "test-user-2",
            html_url: "https://github.com/test-user-2",
            name: "Test User 2",
          },
        },
        "https://api.github.com/users/user-bot": {
          body: {
            login: "user-bot",
            html_url: "https://github.com/user-bot",
            name: "User Bot",
          },
        },
      };
      require("./fetch").__setMockResponses(usersCache);
    });

    it("get list of valid commiters", async () => {
      const MockedChangelog = require("./changelog").default;
      const changelog = new MockedChangelog({
        ignoreCommitters: ["user-bot"],
      });

      const testCommits = [
        {
          commitSHA: "a0000004",
          githubIssue: { user: { login: "test-user-1" } },
        },
        {
          commitSHA: "a0000003",
          githubIssue: { user: { login: "test-user-2" } },
        },
        { commitSHA: "a0000002", githubIssue: { user: { login: "user-bot" } } },
        { commitSHA: "a0000001" },
      ];
      const committers = await changelog.getCommitters(testCommits);

      expect(committers).toEqual([
        {
          login: "test-user-1",
          html_url: "https://github.com/test-user-1",
          name: "Test User 1",
        },
        {
          login: "test-user-2",
          html_url: "https://github.com/test-user-2",
          name: "Test User 2",
        },
      ]);
    });
  });
});
