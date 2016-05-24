import execSync from "./execSync";

export function request(url) {
  return execSync("curl -H 'Authorization: token " + process.env.GITHUB_AUTH + "' --silent " + url);
}
