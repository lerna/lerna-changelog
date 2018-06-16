const GithubAPI = require.requireActual("../github-api").default;

class MockedGithubAPI extends GithubAPI {
  private getAuthToken() {
    return "123";
  }
}

export default MockedGithubAPI;
