/* tslint:disable:max-line-length */

import GithubAPI from "./github-api";

describe("findPullRequestId", function() {
  it("finds the id in a GitHub merge commit", async function() {
    const message =
      'Merge pull request #42 from Turbo87/pkg-config\n\nRead "changelog" config key from "package.json" too';
    const result = GithubAPI.getIssueNumber(message);
    expect(result).toEqual("42");
  });

  it("finds the id in a GitHub squash-merge commit", async function() {
    const message =
      'Adjust "lint" script (#48)\n\n* bin/cli: Use "const" instead of "var"\n\n* package.json: Adjust "lint" script';
    const result = GithubAPI.getIssueNumber(message);
    expect(result).toEqual("48");
  });

  it("finds the id in a homu merge commit", async function() {
    const message =
      "Auto merge of #7056 - fixTypos:fix_typos, r=Turbo87\n\nfix_typos\n\nThis PR is part of a campaign to fix a lot of typos on github!\nYou can see the progress on https://github.com/fixTypos/fix_typos/\n\nhttps://github.com/client9/misspell";
    const result = GithubAPI.getIssueNumber(message);
    expect(result).toEqual("7056");
  });

  it("returns null if no id could be found", async function() {
    const message = "This is not a merge commit 42";
    const result = GithubAPI.getIssueNumber(message);
    expect(result).toBeNull();
  });
});
