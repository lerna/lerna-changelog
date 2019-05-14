import * as path from "path";
import { Commit } from "../commit";
import { IGitApi, Issue } from "../interfaces";
import ConfigurationError from "../utils/configuration-error";

const normalize = require("normalize-git-url");

export interface Options {
  repo?: string;
  pkg: any;
  rootPath: string;
  ignoreCommitters: string[];
  cacheDir?: string;
}

export abstract class AbstractGitApi<IssueDataType = any> implements IGitApi {
  public abstract readonly baseIssueUrl: string;
  public abstract readonly gitServer: string;
  public abstract readonly gitApiUrl: string;

  public get repo(): string {
    if (!this.REPO_STORED) {
      this.REPO_STORED = findRepoFromPkg(this.config.pkg, [this.gitServer, this.gitApiUrl]);
    }
    if (!this.REPO_STORED) {
      throw new ConfigurationError('Could not infer "repo" from the "package.json" file.');
    }
    return this.REPO_STORED;
  }

  protected cacheDir: string | undefined;
  protected auth: string;

  private ignoreCommitters: string[] = [];
  private REPO_STORED?: string;

  constructor(private readonly config: Options) {
    this.REPO_STORED = config.repo;

    this.cacheDir = config.cacheDir && path.join(config.rootPath, config.cacheDir, "github");
    this.ignoreCommitters = config.ignoreCommitters;
    this.auth = this.getAuthToken();
    if (!this.auth) {
      throw new ConfigurationError("Must provide GITHUB_AUTH");
    }
  }

  public async getIssue(issue: string): Promise<Issue> {
    return this.IssueTransformer(await this.getIssueData(issue));
  }

  // public async getUser(login: string): Promise<User> {
  //   return this.UserTranformer(await this.getUserData(login));
  // }
  public abstract getIssueNumber(commit: Commit): Promise<string | null>;

  protected ignoreCommitter(login: string): boolean {
    return this.ignoreCommitters.some((c: string) => c === login || login.indexOf(c) > -1);
  }

  protected abstract IssueTransformer(IssueData: IssueDataType): Promise<Issue>;
  protected abstract getIssueData(issue: string): Promise<IssueDataType>;

  // protected abstract UserTranformer(UserData: UserDataType): Promise<User>;
  // protected abstract getUserData(login: string): Promise<UserDataType>;
  protected abstract getAuthToken(): string;
}

export function findRepoFromPkg(pkg: any, servers: string[] = []): string | undefined {
  if (!pkg || !pkg.repository) {
    return;
  }
  const url = pkg.repository.url || pkg.repository;
  const normalized = normalize(url).url;
  // TODO
  const repoRegex = new RegExp(
    `(${servers.map(server => server.replace(".", "\\."))})(:\\d*)?[:/]([^./]+\\/[^./]+)(?:\\.git)?`
  );

  const match = normalized.match(repoRegex);
  if (!match) {
    return;
  }

  return match[3];
}
