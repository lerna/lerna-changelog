const GithubAPI = require.requireActual("../GithubAPI").default;

class MockedGithubAPI extends GithubAPI {
  getAuthToken() {
    return "123";
  }
}

export default MockedGithubAPI;
