import child from "child_process";

export default function execSync(cmd) {
  return child.execSync(cmd, { encoding: "utf8" }).trim();
}
