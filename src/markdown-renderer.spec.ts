import { CommitInfo, Release } from "./interfaces";
import MarkdownRenderer from "./markdown-renderer";

const UNRELEASED_TAG = "___unreleased___";

const BASIC_COMMIT = {
  githubIssue: {
    title: "My cool PR",
    user: {
      login: "hzoo",
      html_url: "http://hzoo.com",
    },
  },
} as CommitInfo;

const COMMIT_WITH_NUMBER = {
  githubIssue: {
    title: "My cool PR",
    user: {
      login: "hzoo",
      html_url: "http://hzoo.com",
    },
    number: 42,
    pull_request: {
      html_url: "http://github.com/42",
    },
  },
} as CommitInfo;

const COMMIT_WITH_GH_ISSUE_REF = {
  githubIssue: {
    title: "My cool PR (resolved #123)",
    user: {
      login: "hzoo",
      html_url: "http://hzoo.com",
    },
  },
} as CommitInfo;

const COMMIT_WITH_PHAB_ISSUE_REF = {
  githubIssue: {
    title: "My cool PR (resolved T42)",
    user: {
      login: "hzoo",
      html_url: "http://hzoo.com",
    },
  },
} as CommitInfo;

function renderer(options: any = {}): MarkdownRenderer {
  return new MarkdownRenderer({
    baseIssueUrl: "http://foo.bar/",
    categories: [],
    unreleasedName: "Unreleased",
    ...options,
  });
}

function getToday() {
  return "2018-07-10";
}

describe("MarkdownRenderer", () => {
  describe("renderPackageNames", () => {
    it(`renders an empty list of package names as "Other"`, () => {
      const result = renderer().renderPackageNames([]);
      expect(result).toEqual("Other");
    });

    it(`renders a single package name`, () => {
      const result = renderer().renderPackageNames(["package1"]);
      expect(result).toEqual("`package1`");
    });

    it(`renders a list of package names`, () => {
      const result = renderer().renderPackageNames(["package1", "package2", "package3"]);
      expect(result).toEqual("`package1`, `package2`, `package3`");
    });
  });

  describe("renderContributionList", () => {
    it(`renders a list of contributions`, () => {
      const emptyCommit = {} as CommitInfo;
      const result = renderer().renderContributionList([BASIC_COMMIT, emptyCommit, COMMIT_WITH_NUMBER]);
      expect(result).toMatchSnapshot();
    });
  });

  describe("renderContribution", () => {
    it(`returns undefined if "githubIssue" is not set`, () => {
      const result = renderer().renderContribution({} as CommitInfo);
      expect(result).toBeUndefined();
    });

    it(`renders basic GitHub PRs`, () => {
      const result = renderer().renderContribution(BASIC_COMMIT);
      expect(result).toEqual("My cool PR ([@hzoo](http://hzoo.com))");
    });

    it(`renders GitHub PRs with numbers`, () => {
      const result = renderer().renderContribution(COMMIT_WITH_NUMBER);
      expect(result).toEqual("[#42](http://github.com/42) My cool PR ([@hzoo](http://hzoo.com))");
    });

    it(`normalizes GitHub issue references`, () => {
      const result = renderer().renderContribution(COMMIT_WITH_GH_ISSUE_REF);
      expect(result).toEqual("My cool PR (Closes [#123](http://foo.bar/123)) ([@hzoo](http://hzoo.com))");
    });

    it(`normalizes Phabricator issue references`, () => {
      const result = renderer().renderContribution(COMMIT_WITH_PHAB_ISSUE_REF);
      expect(result).toEqual("My cool PR (Closes [#42](http://foo.bar/42)) ([@hzoo](http://hzoo.com))");
    });
  });

  describe("renderContributorList", () => {
    it(`renders a list of GitHub users`, () => {
      const user1 = {
        login: "hzoo",
        name: "",
        html_url: "https://github.com/hzoo",
      };

      const user2 = {
        login: "Turbo87",
        name: "Tobias Bieniek",
        html_url: "https://github.com/Turbo87",
      };

      const result = renderer().renderContributorList([user1, user2]);

      expect(result).toMatchSnapshot();
    });
  });

  describe("renderContributor", () => {
    it(`renders GitHub user without name`, () => {
      const result = renderer().renderContributor({
        login: "foo",
        name: "",
        html_url: "http://github.com/foo",
      });

      expect(result).toEqual("[@foo](http://github.com/foo)");
    });

    it(`renders GitHub user with name`, () => {
      const result = renderer().renderContributor({
        login: "foo",
        name: "Foo Bar",
        html_url: "http://github.com/foo",
      });

      expect(result).toEqual("Foo Bar ([@foo](http://github.com/foo))");
    });
  });

  describe("groupByCategory", () => {
    it("group commits by category", () => {
      const r = renderer({
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
      const commitsByCategory = r["groupByCategory"](testCommits as CommitInfo[]);

      expect(commitsByCategory).toMatchSnapshot();
    });
  });

  describe("renderRelease", () => {
    it(`renders unreleased commits`, () => {
      const release: Release = {
        name: UNRELEASED_TAG,
        date: getToday(),
        commits: [
          {
            ...BASIC_COMMIT,
            categories: [":rocket: New Feature"],
          },
        ],
      };
      const options = {
        categories: [":rocket: New Feature"],
      };
      const result = renderer(options).renderRelease(release);
      expect(result).toMatchSnapshot();
    });

    it(`renders unreleased commits, with named next release`, () => {
      const release: Release = {
        name: UNRELEASED_TAG,
        date: getToday(),
        commits: [
          {
            ...BASIC_COMMIT,
            categories: [":rocket: New Feature"],
          },
        ],
      };
      const options = {
        categories: [":rocket: New Feature"],
        unreleasedName: "v2.0.0-alpha.0",
      };
      const result = renderer(options).renderRelease(release);
      expect(result).toMatchSnapshot();
    });
  });
});
