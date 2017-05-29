import MarkdownRenderer from "./markdown-renderer";
import {CommitInfo} from "./interfaces";

describe("MarkdownRenderer", () => {
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
