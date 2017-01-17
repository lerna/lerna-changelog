jest.mock("lerna/lib/Repository");
jest.mock("lerna/lib/progressBar");
jest.mock("../src/ApiDataCache");
jest.mock("../src/ConfigurationError");
jest.mock("../src/GithubAPI");
jest.mock("../src/Changelog");

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
        tag: "v0.2.0"
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
        tag: "",
        title: "This is the commit title for the issue (#2)",
        user: {
          html_url: "https://github.com/test-user",
          login: "test-user",
          name: "Test User"
        }
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
        tag: "",
        title: "This is the commit title for the issue (#2)",
        user: {
          html_url: "https://github.com/test-user",
          login: "test-user",
          name: "Test User"
        }
      },
      {
        commitSHA: "a0000002",
        date: "2017-01-01",
        labels: [],
        message: "refactor(module) Simplify implementation",
        tag: ""
      },
      {
        commitSHA: "a0000001",
        date: "2017-01-01",
        labels: [],
        message: "chore(release): releasing component",
        tag: "v0.1.0"
      }
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
      "Test User ([test-user-1](https://github.com/test-user))",
      "Test User ([test-user-2](https://github.com/test-user))"
    ]);
  })
})

describe("createMarkdown", () => {
  const MockedChangelog = require("../src/Changelog").default;
  const changelog = new MockedChangelog();

  beforeEach(() => {
    require("../src/GithubAPI").__resetDefaults();
    require("../src/Changelog").__resetDefaults();
  })

  it("get markdown grouped by tags", () => {
    require("../src/Changelog").__prependListOfCommits([
      // Add some commits that do not belong to a tag yet
      "a0000008;;Merge pull request #3 from my-fix-feature;2017-01-02",
      "a0000007;;feat(module): some unreleased feature;2017-01-02",
      "a0000006;;fix(module): fix a problem (#2);2017-01-02",
    ]);
    const markdown = changelog.createMarkdown();
    expect(markdown).toMatchSnapshot();
  })

  it("get markdown grouped by tags (with commit number link)", () => {
    const issue = require("../src/GithubAPI").createTestIssue(1);
    require("../src/GithubAPI").__setIssue({ ...issue, number: 1 });
    const markdown = changelog.createMarkdown();
    expect(markdown).toMatchSnapshot();
  })

  it("get markdown grouped by tags (with matching fix commit)", () => {
    const issue = require("../src/GithubAPI").createTestIssue(1);
    require("../src/GithubAPI").__setIssue({
      ...issue,
      title: "refactor(module): something. Closes #1"
    });
    const markdown = changelog.createMarkdown();
    expect(markdown).toMatchSnapshot();
  })
})
