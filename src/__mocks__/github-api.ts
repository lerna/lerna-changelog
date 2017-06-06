const GithubAPI = require.requireActual("../github-api").default;

class MockedGithubAPI extends GithubAPI {
  getAuthToken() {
    return "123";
  }
}

export default MockedGithubAPI;
