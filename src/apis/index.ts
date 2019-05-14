import { GitProvider, IGitApi } from "../interfaces";
import { Options as GitProviderOptions } from "./abstract-api";
import GithubAPI from "./github-api";
import GitlabAPI from "./gitlab-api";

export function getGitApi(provider: GitProvider = "github", config: GitProviderOptions): IGitApi {
  switch (provider) {
    case "gitlab":
      return new GitlabAPI(config);
    case "github":
    default:
      return new GithubAPI(config);
  }
}
