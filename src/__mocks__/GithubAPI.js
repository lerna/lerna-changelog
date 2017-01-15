const defaultTestUser = {
  name: "Test User",
  login: "test-user",
  html_url: "https://github.com/test-user"
};

export function createTestIssue (number) {
  return {
    user: defaultTestUser,
    labels: [ { name: "Type: New Feature" }, { name: "Status: In Progress" } ],
    title: `This is the commit title for the issue (#${number})`
  }
}

let customIssue;
export function __resetDefaults () {
  customIssue = undefined;
}
export function __setIssue (issue) {
  customIssue = issue;
}

class MockedGithubAPI {
  getIssueData(number) {
    return customIssue || createTestIssue(number);
  }
  getUserData() {
    return defaultTestUser;
  }
}

export default MockedGithubAPI;
