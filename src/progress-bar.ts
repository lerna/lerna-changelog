import chalk from "chalk";

const ProgressBar = require("progress");

class ProgressBarController {
  private bar: any;

  constructor() {
    this.bar = null;
  }

  public init(title: string, total: number) {
    if (this.bar) {
      this.terminate();
    }

    // Intentionally a noop because node-progress doesn't work well in non-TTY
    // environments
    if (!process.stdout.isTTY) {
      return;
    }

    this.bar = new ProgressBar(`:bar ${title} (:percent)`, {
      total,
      complete: chalk.hex("#0366d6")("█"),
      incomplete: chalk.enabled ? chalk.gray("█") : "░",
      clear: true,

      // terminal columns - package name length - additional characters length
      width: 20,
    });
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
