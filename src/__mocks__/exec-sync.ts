let gitShowResult: { [id: string]: string } = {};
let gitDescribeResult: string | undefined;
let gitLogResult: string | undefined;
let gitTagResult: string | undefined;
export function __resetDefaults () {
  gitShowResult = {};
  gitDescribeResult = undefined;
  gitLogResult = undefined;
  gitTagResult = undefined;
}
export function __mockGitShow (result: { [id: string]: string }) {
  gitShowResult = result;
}
export function __mockGitDescribe (result: string) {
  gitDescribeResult = result;
}
export function __mockGitLog (result: string) {
  gitLogResult = result;
}
export function __mockGitTag (result: string) {
  gitTagResult = result;
}
export default function execSync(cmd: string): string | undefined {
  if (cmd.indexOf("git show") === 0) {
    const sha = cmd.split("--first-parent")[1].trim();
    return gitShowResult[sha] || '';
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
