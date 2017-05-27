#!/usr/bin/env node

"use strict";

const chalk = require("chalk");
const Changelog = require("../").Changelog;
const ConfigurationError = require("../").ConfigurationError;

const argv = require("yargs")
  .usage("Usage: lerna-changelog [options]")
  .options({
    "tag-from": {
      type: "string",
      desc: "A git tag that determines the lower bound of the range of commits (defaults to last available)"
    },
    "tag-to": {
      type: "string",
      desc: "A git tag that determines the upper bound of the range of commits"
    }
  })
  .example(
    "lerna-changelog",
    "create a changelog for the changes after the latest available tag"
  )
  .example(
    "lerna-changelog --tag-from 0.1.0 --tag-to 0.3.0",
    "create a changelog for the changes in all tags within the given range"
  )
  .version()
  .help()
  .argv;

try {
  (new Changelog(argv)).createMarkdown().then((result) => {
    console.log(result);
  }).catch((e) => {
    console.log(chalk.red(e.stack));
  });
} catch (e) {
  if (e instanceof ConfigurationError) {
    console.log(chalk.red(e.message));
  } else {
    throw (e);
  }
}
