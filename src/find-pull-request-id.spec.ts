import findPullRequestId from "./find-pull-request-id";

describe("findPullRequestId", function() {
  it("finds the id in a GitHub merge commit", function() {
    const message = "Merge pull request #42 from Turbo87/pkg-config\n\nRead \"changelog\" config key from \"package.json\" too";
    const result = findPullRequestId(message);
    expect(result).toEqual("42");
  });

  it("finds the id in a GitHub squash-merge commit", function() {
    const message = "Adjust \"lint\" script (#48)\n\n* bin/cli: Use \"const\" instead of \"var\"\n\n* package.json: Adjust \"lint\" script";
    const result = findPullRequestId(message);
    expect(result).toEqual("48");
  });

  it("returns null if no id could be found", function() {
    const message = "This is not a merge commit 42";
    const result = findPullRequestId(message);
    expect(result).toBeNull();
  });
});
