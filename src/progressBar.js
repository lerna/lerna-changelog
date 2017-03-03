import ProgressBar from "progress";
import padEnd from "string.prototype.padend";

class ProgressBarController {
  constructor() {
    this.bar = null;
  }

  init(total) {
    if (this.bar) {
      this.terminate();
    }

    // Intentionally a noop because node-progress doesn't work well in non-TTY
    // environments
    if (!process.stdout.isTTY) {
      return;
    }

    this.bar = new ProgressBar(":packagename ╢:bar╟", {
      total: total,
      complete: "█",
      incomplete: "░",
      clear: true,

      // terminal columns - package name length - additional characters length
      width: (process.stdout.columns || 100) - 50 - 3
    });
  }

  tick(name) {
    if (this.bar) {
      this.bar.tick({
        packagename: padEnd(name.slice(0, 50), 50)
      });
    }
  }

  clear() {
    if (this.bar) {
      this.bar.terminate();
    }
  }

  terminate() {
    this.clear();
    this.bar = null;
  }
}

export default new ProgressBarController();
