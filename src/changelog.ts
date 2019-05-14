import * as Git from "./utils/git";
import { Configuration, IGitApi } from "./interfaces";
import MarkdownRenderer from "./utils/markdown-renderer";
import { Release } from "./release";
import { Commit } from "./commit";
import { getGitApi } from "./apis";

interface Options {
  tagFrom?: string;
  tagTo?: string;
}

export default class Changelog {
  private readonly config: Configuration;
  private gitClient: IGitApi;
  private renderer: MarkdownRenderer;

  constructor(config: Configuration) {
    this.config = config;
    this.gitClient = getGitApi(config.gitProvider, config);
    Commit.ApiClient = this.gitClient;
    Commit.config = this.config;
    this.renderer = new MarkdownRenderer({
      categories: Object.keys(this.config.labels).map(key => this.config.labels[key]),
      baseIssueUrl: this.gitClient.baseIssueUrl,
      unreleasedName: this.config.nextVersion || "Unreleased",
    });
  }

  public async createMarkdown(options: Options = {}) {
    const from = options.tagFrom || (await Git.lastTag());
    const to = options.tagTo || "HEAD";

    const releases = await Release.getRelease(from, to);

    return this.renderer.renderMarkdown(releases);
  }
}
