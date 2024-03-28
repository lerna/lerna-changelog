import { Options } from "../../git-hosting-api/git-hosting-api";

const GithubEnterpriseAPI = jest.requireActual("../../git-hosting-api/github-enterprise-api").default;

class MockedGithubEnterpriseAPI extends GithubEnterpriseAPI {
  constructor(options: Options) {
    super(options);
  }
  private getAuthToken() {
    return "123";
  }
}

export default MockedGithubEnterpriseAPI;
