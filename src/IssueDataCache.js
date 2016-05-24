import fs from "fs";
import path from "path";

export default class IssueDataCache {
  constructor({rootPath, cacheDir}) {
    const dir = this.dir = cacheDir && path.join(rootPath, cacheDir);

    if (dir) {
      try {
        fs.statSync(dir);
      } catch (e) {
        fs.mkdirSync(dir);
      }
    }
  }

  get(issue) {
    if (!this.dir) return;
    try {
      return fs.readFileSync(this.fn(issue), "utf-8");
    } catch (e) {
      // Pass.
    }
  }

  set(issue, data) {
    if (!this.dir) return;
    return fs.writeFileSync(this.fn(issue), data);
  }

  fn(issue) {
    return path.join(this.dir, issue);
  }
}
