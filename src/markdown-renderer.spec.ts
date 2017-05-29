import MarkdownRenderer from "./markdown-renderer";
import {CommitInfo} from "./interfaces";

const BASIC_COMMIT = {
  githubIssue: {
    title: 'My cool PR',
    user: {
      login: 'hzoo',
      html_url: 'http://hzoo.com',
    },
  },
} as CommitInfo;

const COMMIT_WITH_NUMBER = {
  githubIssue: {
    title: 'My cool PR',
    user: {
      login: 'hzoo',
      html_url: 'http://hzoo.com',
    },
    number: 42,
    pull_request: {
      html_url: 'http://github.com/42',
    },
  },
} as CommitInfo;

const COMMIT_WITH_GH_ISSUE_REF = {
  githubIssue: {
    title: 'My cool PR (resolved #123)',
    user: {
      login: 'hzoo',
      html_url: 'http://hzoo.com',
    },
  },
} as CommitInfo;

const COMMIT_WITH_PHAB_ISSUE_REF = {
  githubIssue: {
    title: 'My cool PR (resolved T42)',
    user: {
      login: 'hzoo',
      html_url: 'http://hzoo.com',
    },
  },
} as CommitInfo;

describe("MarkdownRenderer", () => {
  describe("renderContribution", () => {
    let renderer: MarkdownRenderer;
    beforeEach(function() {
      renderer = new MarkdownRenderer({
        baseIssueUrl: 'http://foo.bar/',
        categories: [],
      });
    });

    it(`returns undefined if "githubIssue" is not set`, () => {
      const result = renderer.renderContribution({} as CommitInfo);
      expect(result).toBeUndefined();
    });

    it(`renders basic GitHub PRs`, () => {
      const result = renderer.renderContribution(BASIC_COMMIT);
      expect(result).toEqual("My cool PR. ([@hzoo](http://hzoo.com))");
    });

    it(`renders GitHub PRs with numbers`, () => {
      const result = renderer.renderContribution(COMMIT_WITH_NUMBER);
      expect(result).toEqual("[#42](http://github.com/42) My cool PR. ([@hzoo](http://hzoo.com))");
    });

    it(`normalizes GitHub issue references`, () => {
      const result = renderer.renderContribution(COMMIT_WITH_GH_ISSUE_REF);
      expect(result).toEqual("My cool PR (Closes [#123](http://foo.bar/123)). ([@hzoo](http://hzoo.com))");
    });

    it(`normalizes Phabricator issue references`, () => {
      const result = renderer.renderContribution(COMMIT_WITH_PHAB_ISSUE_REF);
      expect(result).toEqual("My cool PR (Closes [#42](http://foo.bar/42)). ([@hzoo](http://hzoo.com))");
    });
  });

  describe("renderContributorList", () => {
    let renderer: MarkdownRenderer;
    beforeEach(function() {
      renderer = new MarkdownRenderer({
        baseIssueUrl: 'http://foo.bar/',
        categories: [],
      });
    });

    it(`renders a list of GitHub users`, () => {
      const user1 = {
        login: 'hzoo',
        name: '',
        html_url: 'https://github.com/hzoo',
      };

      const user2 = {
        login: 'Turbo87',
        name: 'Tobias Bieniek',
        html_url: 'https://github.com/Turbo87',
      };

      const result = renderer.renderContributorList([user1, user2]);

      expect(result).toMatchSnapshot();
    });
  });

  describe("renderContributor", () => {
    let renderer: MarkdownRenderer;
    beforeEach(function() {
      renderer = new MarkdownRenderer({
        baseIssueUrl: 'http://foo.bar/',
        categories: [],
      });
    });

    it(`renders GitHub user without name`, () => {
      const result = renderer.renderContributor({
        login: 'foo',
        name: '',
        html_url: 'http://github.com/foo',
      });

      expect(result).toEqual("[foo](http://github.com/foo)");
    });

    it(`renders GitHub user with name`, () => {
      const result = renderer.renderContributor({
        login: 'foo',
        name: 'Foo Bar',
        html_url: 'http://github.com/foo',
      });

      expect(result).toEqual("Foo Bar ([foo](http://github.com/foo))");
    });
  });

  describe("groupByCategory", () => {
    it("group commits by category", () => {
      const renderer = new MarkdownRenderer({
        baseIssueUrl: 'http://foo.bar',
        categories: [
          ":rocket: New Feature",
          ":boom: Breaking Change",
          ":bug: Bug Fix",
          ":nail_care: Enhancement",
          ":memo: Documentation",
          ":house: Maintenance",
        ],
      });
      const testCommits = [
        { commitSHA: "a0000005", categories: [] },
        { commitSHA: "a0000004", categories: [":bug: Bug Fix"] },
        { commitSHA: "a0000003", categories: [":rocket: New Feature"] },
        { commitSHA: "a0000002", categories: [] },
        { commitSHA: "a0000001", categories: [":bug: Bug Fix"] },
      ];
      const commitsByCategory = renderer.groupByCategory(testCommits as CommitInfo[]);

      expect(commitsByCategory).toMatchSnapshot();
    });
  });
});
