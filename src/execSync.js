import child from "child_process";

export default function execSync(cmd, options = {}) {
  const opts = Object.assign({
    encoding: "utf8"
  }, options);

  return child.execSync(cmd, opts).trim();
}
