#!/usr/bin/env node

var chalk = require("chalk");
var argv = require("yargs").argv;
var Changelog = require(".").Changelog;
var ConfigurationError = require(".").ConfigurationError;

if (argv.help) {
  console.log(
    "\n" +
    "  Usage: lerna-changelog [options]" +
    "\n\n\n" +
    "  Options:" +
    "\n" +
    "    --tagFrom <tag>  define a custom tag to determine the lower bound of the range of commits (default: last available git tag)" +
    "\n" +
    "    --tagTo <tag>    define a custom tag to determine the upper bound of the range of commits"
  );
  process.exit(0);
}

try {
  console.log((new Changelog(argv)).createMarkdown());
} catch (e) {
  if (e instanceof ConfigurationError) {
    console.log(chalk.red(e.message));
  } else {
    throw (e);
  }
}
