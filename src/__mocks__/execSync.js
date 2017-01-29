let gitShowResult;
let gitDescribeResult;
let gitLogResult;
let gitTagResult;
export function __resetDefaults () {
  gitShowResult = undefined;
  gitDescribeResult = undefined;
  gitLogResult = undefined;
  gitTagResult = undefined;
}
export function __mockGitShow (result) {
  gitShowResult = result;
}
export function __mockGitDescribe (result) {
  gitDescribeResult = result;
}
export function __mockGitLog (result) {
  gitLogResult = result;
}
export function __mockGitTag (result) {
  gitTagResult = result;
}
export default function execSync(cmd) {
  if (cmd.indexOf("git show") === 0) {
    const sha = cmd.split("--first-parent")[1].trim();
    return gitShowResult[sha];
  } else if (cmd.indexOf("git describe") === 0)
    return gitDescribeResult;
  else if (cmd.indexOf("git log") === 0)
    return gitLogResult;
  else if (cmd.indexOf("git tag") === 0)
    return gitTagResult;
  else
    throw new Error(
      "Unknown exec command: " + cmd + ". Please make sure to mock it."
    );
}
