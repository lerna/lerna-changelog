jest.mock("lerna/lib/Repository");
jest.mock("lerna/lib/progressBar");
jest.mock("../src/ApiDataCache");
jest.mock("../src/Changelog");
jest.mock("../src/GithubAPI");
jest.mock("../src/execSync");

describe("contructor", () => {
  const MockedChangelog = require("../src/Changelog").default;
  const testConfig = require("../src/Changelog").__getConfig();

  beforeEach(() => {
    require("../src/Changelog").__resetDefaults();
  })

  it("set config", () => {
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

describe("getCommitsInfo", () => {
  beforeEach(() => {
    require("../src/execSync").__resetDefaults();
    require("../src/ApiDataCache").__resetDefaults();
  })
  require("../src/execSync").__mockGitLog(
    "a0000005;HEAD -> master, tag: v0.2.0, origin/master, origin/HEAD;chore(release): releasing component;2017-01-01\n" +
    "a0000004;;Merge pull request #2 from my-feature;2017-01-01\n" +
    "a0000003;;feat(module) Add new module (#2);2017-01-01\n" +
    "a0000002;;refactor(module) Simplify implementation;2017-01-01\n" +
    "a0000001;tag: v0.1.0;chore(release): releasing component;2017-01-01"
  );
  require("../src/execSync").__mockGitTag(
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
  require("../src/ApiDataCache").__setCache({
    user: usersCache,
    issue: issuesCache,
  });
  const MockedChangelog = require("../src/Changelog").default;
  const changelog = new MockedChangelog();
  const commitsInfo = changelog.getCommitsInfo();

  it("parse commits with different tags", () => {
    expect(commitsInfo).toEqual([
      {
        commitSHA: "a0000005",
        date: "2017-01-01",
        labels: [],
        message: "chore(release): releasing component",
        tags: ["v0.2.0"],
      },
      {
        commitSHA: "a0000004",
        date: "2017-01-01",
        labels: [
          { name: "Type: New Feature" },
          { name: "Status: In Progress" },
        ],
        mergeMessage: "Merge pull request #2 from my-feature",
        message: "Merge pull request #2 from my-feature",
        number: 2,
        tags: undefined,
        title: "This is the commit title for the issue (#2)",
        user: {
          html_url: "https://github.com/test-user",
          login: "test-user",
          name: "Test User",
        },
      },
      {
        commitSHA: "a0000003",
        date: "2017-01-01",
        labels: [
          { name: "Type: New Feature" },
          { name: "Status: In Progress" },
        ],
        mergeMessage: "feat(module) Add new module (#2)",
        message: "feat(module) Add new module (#2)",
        number: 2,
        tags: undefined,
        title: "This is the commit title for the issue (#2)",
        user: {
          html_url: "https://github.com/test-user",
          login: "test-user",
          name: "Test User",
        },
      },
      {
        commitSHA: "a0000002",
        date: "2017-01-01",
        labels: [],
        message: "refactor(module) Simplify implementation",
        tags: undefined,
      },
      {
        commitSHA: "a0000001",
        date: "2017-01-01",
        labels: [],
        message: "chore(release): releasing component",
        tags: ["v0.1.0"],
      },
    ]);
  });
});

describe("getCommitsByCategory", () => {
  const MockedChangelog = require("../src/Changelog").default;
  const changelog = new MockedChangelog();
  const testCommits = [
    { commitSHA: "a0000005", labels: [{ name: "Status: In Progress" }] },
    { commitSHA: "a0000004", labels: [{ name: "Type: Bug" }] },
    {
      commitSHA: "a0000003",
      labels: [
        { name: "Type: New Feature" },
        { name: "Status: In Progress" },
      ]
    },
    { commitSHA: "a0000002", labels: [] },
    { commitSHA: "a0000001", labels: [] }
  ]
  const commitsByCategory = changelog.getCommitsByCategory(testCommits);

  it("group commits by category", () => {
    expect(commitsByCategory).toEqual([
      {
        commits: [
          {
            commitSHA: "a0000003",
            labels: [
              { name: "Type: New Feature" },
              { name: "Status: In Progress" }
            ]
          }
        ],
        heading: ":rocket: New Feature"
      },
      { commits: [], heading: ":boom: Breaking Change" },
      {
        commits: [
          { commitSHA: "a0000004", labels: [{ name: "Type: Bug" }] }
        ],
        heading: ":bug: Bug Fix"
      },
      { commits: [], heading: ":nail_care: Enhancement" },
      { commits: [], heading: ":memo: Documentation" },
      { commits: [], heading: ":house: Maintenance" }
    ]);
  })
})

describe("getCommitters", () => {
  beforeEach(() => {
    require("../src/ApiDataCache").__resetDefaults();
  })

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
  require("../src/ApiDataCache").__setCache({
    user: usersCache,
    issue: {},
  });
  require("../src/Changelog").__setConfig({ ignoreCommitters: ["user-bot"] });
  const MockedChangelog = require("../src/Changelog").default;
  const changelog = new MockedChangelog();

  const testCommits = [
    { commitSHA: "a0000004", user: { login: "test-user-1" } },
    { commitSHA: "a0000003", user: { login: "test-user-2" } },
    { commitSHA: "a0000002", user: { login: "user-bot" } },
    { commitSHA: "a0000001" },
  ]
  const committers = changelog.getCommitters(testCommits);

  it("get list of valid commiters", () => {
    expect(committers).toEqual([
      "Test User 1 ([test-user-1](https://github.com/test-user-1))",
      "Test User 2 ([test-user-2](https://github.com/test-user-2))"
    ]);
  })
})
