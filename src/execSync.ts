const child = require("child_process");

export default function execSync(cmd: string, options = {}) {
  const opts = { encoding: "utf8", ...options };

  return child.execSync(cmd, opts).trim();
}
