jest.mock("../src/github-api");
jest.mock("./fetch");

const MockedGithubAPI = require("./github-api").default;

const repo = "lerna/lerna-changelog";
const issue = "2";
const login = "test-user";

describe("GithubAPI", () => {
  describe("getBaseIssueUrl", () => {
    it("get base issue URL", async () => {
      const github = new MockedGithubAPI({ repo, rootPath: "" });
      const url = github.getBaseIssueUrl(repo);

      expect(url).toEqual(`https://github.com/${repo}/issues/`);
    });
  });

  describe("getIssueData", () => {
    beforeEach(() => {
      const issuesCache = {
        "https://api.github.com/repos/lerna/lerna-changelog/issues/2": {
          body: {
            number: 2,
            title: "This is the commit title for the issue (#2)",
            labels: [{ name: "Type: New Feature" }, { name: "Status: In Progress" }],
            user: {
              "https://api.github.com/users/test-user": {
                login: "test-user",
                html_url: "https://github.com/test-user",
                name: "Test User",
              },
            },
          },
        },
      };
      require("./fetch").__setMockResponses(issuesCache);
    });

    afterEach(() => {
      require("./fetch").__resetMockResponses();
      jest.resetAllMocks();
    });

    it("get an issue data", async () => {
      const github = new MockedGithubAPI({ repo, rootPath: "" });
      const issueData = await github.getIssueData(repo, issue);

      expect(issueData).toMatchSnapshot();
    });
  });

  describe("getUserData", () => {
    beforeEach(() => {
      const usersCache = {
        "https://api.github.com/users/test-user": {
          body: {
            login: "test-user",
            html_url: "https://github.com/test-user",
            name: "Test User",
          },
        },
      };
      require("./fetch").__setMockResponses(usersCache);
    });

    afterEach(() => {
      require("./fetch").__resetMockResponses();
      jest.resetAllMocks();
    });

    it("get an user data", async () => {
      const github = new MockedGithubAPI({ repo, rootPath: "" });
      const issueData = await github.getUserData(login);

      expect(issueData).toMatchSnapshot();
    });
  });
});
