#!/usr/bin/env node

var chalk = require("chalk");
var lib = require(".");

var Changelog = lib.Changelog;
var ConfigurationError = lib.ConfigurationError;
var args = process.argv.slice(2);

try {
  console.log((new Changelog(null, args[0])).createMarkdown());
} catch (e) {
  if (e instanceof ConfigurationError) {
    console.log(chalk.red(e.message));
  } else {
    throw (e);
  }
}
