import { Options } from "../../git-hosting-api/git-hosting-api";

const GithubAPI = jest.requireActual("../../git-hosting-api/github-api").default;

class MockedGithubAPI extends GithubAPI {
  constructor(options: Options) {
    super(options);
  }
  private getAuthToken() {
    return "123";
  }
}

export default MockedGithubAPI;
