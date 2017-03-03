jest.mock("lerna/lib/Repository");
jest.mock("lerna/lib/progressBar");
jest.mock("../../src/ApiDataCache");
jest.mock("../../src/Changelog");
jest.mock("../../src/GithubAPI");
jest.mock("../../src/execSync");

const listOfCommits =
  "a0000015;;chore: making of episode viii;2015-12-18\n" +
  "a0000014;;feat: infiltration (#7);2015-12-18\n" +
  "a0000013;HEAD -> master, tag: v6.0.0, origin/master, " +
  "origin/HEAD;chore(release): releasing component;1983-05-25\n" +
  "a0000012;;Merge pull request #6 from return-of-the-jedi;1983-05-25\n" +
  "a0000011;;feat: I am your father (#5);1983-05-25\n" +
  "a0000010;;fix(han-solo): unfreezes (#4);1983-05-25\n" +
  "a0000009;tag: v5.0.0;chore(release): releasing component;1980-05-17\n" +
  "a0000008;;Merge pull request #3 from empire-strikes-back;1980-05-17\n" +
  "a0000007;;fix: destroy rebels base;1980-05-17\n" +
  "a0000006;;chore: the end of Alderaan (#2);1980-05-17\n" +
  "a0000005;;refactor(death-star): add deflector shield;1980-05-17\n" +
  "a0000004;tag: v4.0.0;chore(release): releasing component;1977-05-25\n" +
  "a0000003;;Merge pull request #1 from star-wars;1977-05-25\n" +
  "a0000002;tag: v0.1.0;chore(release): releasing component;1966-01-01\n" +
  "a0000001;;fix: some random fix which will be ignored;1966-01-01";

const listOfTags =
  "v6.0.0\n" +
  "v5.0.0\n" +
  "v4.0.0\n" +
  "v3.0.0\n" +
  "v2.0.0\n" +
  "v1.0.0\n" +
  "v0.1.0";

const listOfPackagesForEachCommit = {
  a0000001: "packages/random/foo.js",
  a0000002: "packages/random/package.json",
  a0000003: "packages/a-new-hope/rebels.js",
  a0000004: "packages/a-new-hope/package.json",
  a0000005: "packages/empire-strikes-back/death-star.js",
  a0000006: "packages/empire-strikes-back/death-star.js",
  a0000007: "packages/empire-strikes-back/hoth.js",
  a0000008: "packages/empire-strikes-back/hoth.js",
  a0000009: "packages/empire-strikes-back/package.json",
  a0000010: "packages/return-of-the-jedi/jabba-the-hutt.js",
  a0000011: "packages/return-of-the-jedi/vader-luke.js",
  a0000012: "packages/return-of-the-jedi/leia.js",
  a0000013: "packages/return-of-the-jedi/package.json",
  a0000014:
    "packages/the-force-awakens/mission.js\n" +
    "packages/rogue-one/mission.js",
  a0000015: "packages/untitled/script.md",
};

const usersCache = {
  luke: {
    login: "luke",
    html_url: "https://github.com/luke",
    name: "Luke Skywalker"
  },
  "princess-leia": {
    login: "princess-leia",
    html_url: "https://github.com/princess-leia",
    name: "Princess Leia Organa"
  },
  vader: {
    login: "vader",
    html_url: "https://github.com/vader",
    name: "Darth Vader"
  },
  gtarkin: {
    login: "gtarkin",
    html_url: "https://github.com/gtarkin",
    name: "Governor Tarkin"
  },
  "han-solo": {
    login: "han-solo",
    html_url: "https://github.com/han-solo",
    name: "Han Solo"
  },
  chewbacca: {
    login: "chewbacca",
    html_url: "https://github.com/chewbacca",
    name: "Chwebacca"
  },
  "rd-d2": {
    login: "rd-d2",
    html_url: "https://github.com/rd-d2",
    name: "R2-D2"
  },
  "c-3po": {
    login: "c-3po",
    html_url: "https://github.com/c-3po",
    name: "C-3PO"
  }
};
const issuesCache = {
  1: {
    number: 1,
    title: "feat: May the force be with you",
    labels: [
      { name: "Type: New Feature" },
    ],
    user: usersCache.luke,
  },
  2: {
    number: 2,
    title: "chore: Terminate her... immediately!",
    labels: [
      { name: "Type: Breaking Change" },
    ],
    user: usersCache.gtarkin,
  },
  3: {
    number: 3,
    title: "fix: Get me the rebels base!",
    labels: [
      { name: "Type: Bug" },
    ],
    user: usersCache.vader,
  },
  4: {
    number: 4,
    title: "fix: RRRAARRWHHGWWR",
    labels: [
      { name: "Type: Bug" },
      { name: "Type: Maintenance" },
    ],
    user: usersCache.chewbacca,
  },
  5: {
    number: 5,
    title: "feat: I am your father",
    labels: [
      { name: "Type: New Feature" },
    ],
    user: usersCache.vader,
  },
  6: {
    number: 6,
    title: "refactor: he is my brother",
    labels: [
      { name: "Type: Enhancement" },
    ],
    user: usersCache["princess-leia"],
  },
  7: {
    number: 7,
    title: "feat: that is not how the Force works!",
    labels: [
      { name: "Type: New Feature" },
      { name: "Type: Enhancement" },
    ],
    user: usersCache["han-solo"],
  },
};


describe.only("createMarkdown", () => {
  beforeEach(() => {
    require("../../src/execSync").__resetDefaults();
    require("../../src/ApiDataCache").__resetDefaults();
  });

  describe("single tags", () => {
    require("../../src/execSync").__mockGitShow(listOfPackagesForEachCommit);
    require("../../src/execSync").__mockGitDescribe("v8.0.0");
    require("../../src/execSync").__mockGitLog(listOfCommits);
    require("../../src/execSync").__mockGitTag(listOfTags);
    require("../../src/ApiDataCache").__setCache({
      user: usersCache,
      issue: issuesCache,
    });
    const MockedChangelog = require("../../src/Changelog").default;
    const changelog = new MockedChangelog();

    const markdown = changelog.createMarkdown({
      "tag-from": "v4.0.0",
      "tag-to": undefined,
    });
    it("outputs correct changelog", () => {
      expect(markdown).toMatchSnapshot();
    });
  });

  describe("multiple tags", () => {
    require("../../src/execSync").__mockGitShow(listOfPackagesForEachCommit);
    require("../../src/execSync").__mockGitDescribe("v8.0.0");
    require("../../src/execSync").__mockGitLog(
      "a0000004;tag: a-new-hope@4.0.0, tag: empire-strikes-back@5.0.0, " +
      "tag: return-of-the-jedi@6.0.0;chore(release): releasing component;1977-05-25\n" +
      "a0000003;;Merge pull request #1 from star-wars;1977-05-25\n" +
      "a0000002;tag: v0.1.0;chore(release): releasing component;1966-01-01\n" +
      "a0000001;;fix: some random fix which will be ignored;1966-01-01"
    );
    require("../../src/execSync").__mockGitTag(
      "a-new-hope@4.0.0\n" +
      "attack-of-the-clones@3.1.0\n" +
      "empire-strikes-back@5.0.0\n" +
      "return-of-the-jedi@6.0.0\n" +
      "revenge-of-the-sith@3.0.0\n" +
      "the-force-awakens@7.0.0\n" +
      "the-phantom-menace@1.0.0"
    );
    require("../../src/ApiDataCache").__setCache({
      user: usersCache,
      issue: issuesCache,
    });
    const MockedChangelog = require("../../src/Changelog").default;
    const changelog = new MockedChangelog();

    const markdown = changelog.createMarkdown({
      "tag-from": "v0.1.0",
      "tag-to": undefined,
    });
    it("outputs correct changelog", () => {
      expect(markdown).toMatchSnapshot();
    });
  });
});
