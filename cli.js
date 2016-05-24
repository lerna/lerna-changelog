#!/usr/bin/env node

var chalk = require("chalk");

try {
  console.log(require(".").getChangelog().createMarkdown());
} catch (e) {
  if (e.name.indexOf("GITHUB_AUTH") !== -1) {
    console.log(chalk.red("Must provide GITHUB_AUTH"));
  } else {
    throw (e);
  }
}
