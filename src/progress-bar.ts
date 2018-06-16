const ProgressBar = require("progress");
const padEnd = require("string.prototype.padend");

class ProgressBarController {
  private bar: any;

  constructor() {
    this.bar = null;
  }

  public init(total: number) {
    if (this.bar) {
      this.terminate();
    }

    // Intentionally a noop because node-progress doesn't work well in non-TTY
    // environments
    if (!process.stdout.isTTY) {
      return;
    }

    this.bar = new ProgressBar(":packagename ╢:bar╟", {
      total,
      complete: "█",
      incomplete: "░",
      clear: true,

      // terminal columns - package name length - additional characters length
      width: ((process.stdout as any).columns || 100) - 50 - 3,
    });
  }

  public setTitle(name: string) {
    if (this.bar) {
      this.bar.tick(0, {
        packagename: padEnd(name.slice(0, 50), 50),
      });
    }
  }

  public tick() {
    if (this.bar) {
      this.bar.tick(1);
    }
  }

  public clear() {
    if (this.bar) {
      this.bar.terminate();
    }
  }

  public terminate() {
    this.clear();
    this.bar = null;
  }
}

export default new ProgressBarController();
