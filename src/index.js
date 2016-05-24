import Changelog from "./Changelog";

exports.getChangelog = function () {
  if (process.env.GITHUB_AUTH) {
    return new Changelog();
  } else {
    throw new Error("Must provide GITHUB_AUTH");
  }
};
