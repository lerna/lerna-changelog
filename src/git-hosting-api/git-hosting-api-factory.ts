import { GitHostingAPI, Options } from "./git-hosting-api";
import GithubAPI from "./github-api";
import GithubEnterpriseAPI from "./github-enterprise-api";

export function createGitHostingAPI(options: Options): GitHostingAPI {
  return options.gitHostingServerURL ? new GithubEnterpriseAPI(options) : new GithubAPI(options);
}
