/* tslint:disable:max-line-length */

import { CommitListItem } from "../git";

jest.mock("../../src/progress-bar");
jest.mock("../../src/changelog");
jest.mock("../../src/github-api");
jest.mock("../git");
jest.mock("../fetch");
jest.mock("../packages");

const listOfCommits: CommitListItem[] = [];

const listOfTags = ["v6.0.0", "v5.0.0", "v4.0.0", "v3.0.0", "v2.0.0", "v1.0.0", "v0.1.0"];

const listOfPackagesForEachCommit: { [id: string]: string[] } = {
  a0000001: ["packages/random/foo.js"],
  a0000002: ["packages/random/package.json"],
  a0000003: ["packages/star-wars/a-new-hope/rebels.js"],
  a0000004: ["packages/star-wars/a-new-hope/package.json"],
  a0000005: ["packages/star-wars/empire-strikes-back/death-star.js"],
  a0000006: ["packages/star-wars/empire-strikes-back/death-star.js"],
  a0000007: ["packages/star-wars/empire-strikes-back/hoth.js"],
  a0000008: ["packages/star-wars/empire-strikes-back/hoth.js"],
  a0000009: ["packages/star-wars/empire-strikes-back/package.json"],
  a0000010: ["packages/star-wars/return-of-the-jedi/jabba-the-hutt.js"],
  a0000011: ["packages/star-wars/return-of-the-jedi/vader-luke.js"],
  a0000012: ["packages/star-wars/return-of-the-jedi/leia.js"],
  a0000013: ["packages/star-wars/return-of-the-jedi/package.json"],
  a0000014: [
    "packages/star-wars/the-force-awakens/mission.js",
    "packages/star-wars/origin-stories/rogue-one/mission.js",
  ],
  a0000015: ["packages/untitled/script.md"],
};

const listOfFileForEachCommit: { [id: string]: string[] } = {
  a0000001: ["random/foo.js"],
  a0000002: ["random/package.json"],
  a0000003: ["a-new-hope/rebels.js"],
  a0000004: ["a-new-hope/package.json"],
  a0000005: ["empire-strikes-back/death-star.js"],
  a0000006: ["empire-strikes-back/death-star.js"],
  a0000007: ["empire-strikes-back/hoth.js"],
  a0000008: ["empire-strikes-back/hoth.js"],
  a0000009: ["empire-strikes-back/package.json"],
  a0000010: ["return-of-the-jedi/jabba-the-hutt.js"],
  a0000011: ["return-of-the-jedi/vader-luke.js"],
  a0000012: ["return-of-the-jedi/leia.js"],
  a0000013: ["return-of-the-jedi/package.json"],
  a0000014: ["the-force-awakens/mission.js", "rogue-one/mission.js"],
  a0000015: ["untitled/script.md"],
};

const usersCache = {
  "https://api.github.com/users/luke": {
    body: {
      login: "luke",
      html_url: "https://github.com/luke",
      name: "Luke Skywalker",
    },
  },
  "https://api.github.com/users/vader": {
    body: {
      login: "vader",
      html_url: "https://github.com/vader",
      name: "Darth Vader",
    },
  },
  "https://api.github.com/users/gtarkin": {
    body: {
      login: "gtarkin",
      html_url: "https://github.com/gtarkin",
      name: "Governor Tarkin",
    },
  },
};
const issuesCache = {
  "https://api.github.com/repos/lerna/lerna-changelog/issues/1": {
    body: {
      number: 1,
      title: "feat: May the force be with you",
      labels: [{ name: "Type: New Feature" }],
      pull_request: {
        html_url: "https://github.com/lerna/lerna-changelog/pull/1",
      },
      user: usersCache["https://api.github.com/users/luke"],
    },
  },
  "https://api.github.com/repos/lerna/lerna-changelog/issues/2": {
    body: {
      number: 2,
      title: "chore: Terminate her... immediately!",
      labels: [{ name: "Type: Breaking Change" }],
      pull_request: {
        html_url: "https://github.com/lerna/lerna-changelog/pull/2",
      },
      user: usersCache["https://api.github.com/users/gtarkin"],
    },
  },
  "https://api.github.com/repos/lerna/lerna-changelog/issues/3": {
    body: {
      number: 3,
      title: "fix: Get me the rebels base!",
      labels: [{ name: "Type: Bug" }],
      pull_request: {
        html_url: "https://github.com/lerna/lerna-changelog/pull/3",
      },
      user: usersCache["https://api.github.com/users/vader"],
    },
  },
};
const listOfWorkspacePackages = [
  {
    name: "random",
    location: "/path/to/project/packages/random",
  },
  {
    name: "@star-wars/a-new-hope",
    location: "/path/to/project/packages/star-wars/a-new-hope",
  },
  {
    name: "@star-wars/empire-strikes-back",
    location: "/path/to/project/packages/star-wars/empire-strikes-back",
  },
  {
    name: "@star-wars/return-of-the-jedi",
    location: "/path/to/project/packages/star-wars/return-of-the-jedi",
  },
  {
    name: "@star-wars/the-force-awakens",
    location: "/path/to/project/packages/star-wars/the-force-awakens",
  },
  {
    name: "@star-wars/rogue-one",
    location: "/path/to/project/packages/star-wars/origin-stories/rogue-one",
  },
  {
    name: "@star-wars/solo",
    location: "/path/to/project/packages/star-wars/origin-stories/solo",
  },
];

describe("createMarkdown", () => {
  beforeEach(() => {
    require("../fetch").__resetMockResponses();
    require("../packages").getPackages.mockImplementation(() => listOfWorkspacePackages);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("multiple tags", () => {
    it("outputs correct changelog", async () => {
      require("../git").changedPaths.mockImplementation((sha: string) => listOfPackagesForEachCommit[sha]);
      require("../git").lastTag.mockImplementation(() => "v8.0.0");
      require("../git").listCommits.mockImplementation(() => listOfCommits);
      require("../git").listTagNames.mockImplementation(() => [
        "a-new-hope@4.0.0",
        "attack-of-the-clones@3.1.0",
        "empire-strikes-back@5.0.0",
        "return-of-the-jedi@6.0.0",
        "revenge-of-the-sith@3.0.0",
        "the-force-awakens@7.0.0",
        "the-phantom-menace@1.0.0",
      ]);

      require("../fetch").__setMockResponses({
        ...usersCache,
        ...issuesCache,
      });

      const MockedChangelog = require("../changelog").default;
      const changelog = new MockedChangelog();

      const markdown = await changelog.createMarkdown();

      expect(markdown).toMatchSnapshot();
    });
  });
  describe("single tags", () => {
    it("outputs correct changelog", async () => {
      require("../git").changedPaths.mockImplementation((sha: string) => listOfPackagesForEachCommit[sha]);
      require("../git").lastTag.mockImplementation(() => "v8.0.0");
      require("../git").listCommits.mockImplementation(() => listOfCommits);
      require("../git").listTagNames.mockImplementation(() => listOfTags);

      require("../fetch").__setMockResponses({
        ...usersCache,
        ...issuesCache,
      });

      const MockedChangelog = require("../changelog").default;
      const changelog = new MockedChangelog();

      const markdown = await changelog.createMarkdown();

      expect(markdown).toMatchSnapshot();
    });
  });

  describe("single project", () => {
    it("outputs correct changelog", async () => {
      require("../git").changedPaths.mockImplementation((sha: string) => listOfFileForEachCommit[sha]);
      require("../git").lastTag.mockImplementation(() => "v8.0.0");
      require("../git").listCommits.mockImplementation(() => listOfCommits);
      require("../git").listTagNames.mockImplementation(() => listOfTags);

      require("../fetch").__setMockResponses({
        ...usersCache,
        ...issuesCache,
      });

      const MockedChangelog = require("../changelog").default;
      const changelog = new MockedChangelog();

      const markdown = await changelog.createMarkdown();

      expect(markdown).toMatchSnapshot();
    });
  });
});
