import MarkdownRenderer from "./markdown-renderer";
import {CommitInfo} from "./interfaces";

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
      const result = renderer.renderContribution({
        githubIssue: {
          title: 'My cool PR',
          user: {
            login: 'hzoo',
            html_url: 'http://hzoo.com',
          },
        },
      } as CommitInfo);

      expect(result).toEqual("My cool PR. ([@hzoo](http://hzoo.com))");
    });

    it(`renders GitHub PRs with numbers`, () => {
      const result = renderer.renderContribution({
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
      } as CommitInfo);

      expect(result).toEqual("[#42](http://github.com/42) My cool PR. ([@hzoo](http://hzoo.com))");
    });

    it(`normalizes GitHub issue references`, () => {
      const result = renderer.renderContribution({
        githubIssue: {
          title: 'My cool PR (resolved #123)',
          user: {
            login: 'hzoo',
            html_url: 'http://hzoo.com',
          },
        },
      } as CommitInfo);

      expect(result).toEqual("My cool PR (Closes [#123](http://foo.bar/123)). ([@hzoo](http://hzoo.com))");
    });

    it(`normalizes Phabricator issue references`, () => {
      const result = renderer.renderContribution({
        githubIssue: {
          title: 'My cool PR (resolved T42)',
          user: {
            login: 'hzoo',
            html_url: 'http://hzoo.com',
          },
        },
      } as CommitInfo);

      expect(result).toEqual("My cool PR (Closes [#42](http://foo.bar/42)). ([@hzoo](http://hzoo.com))");
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
