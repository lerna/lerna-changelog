/* tslint:disable:no-console */

import chalk from "chalk";

import { highlight } from "cli-highlight";

import Changelog from "./changelog";
import ConfigurationError from "./configuration-error";

export async function run() {
  const yargs = require("yargs");

  const argv = yargs
    .usage("lerna-changelog [options]")
    .options({
      from: {
        type: "string",
        desc: "A git tag or commit hash that determines the lower bound of the range of commits",
        defaultDescription: "latest tagged commit",
      },
      to: {
        type: "string",
        desc: "A git tag or commit hash that determines the upper bound of the range of commits",
      },
      "tag-from": {
        hidden: true,
        type: "string",
        desc: "A git tag that determines the lower bound of the range of commits (defaults to last available)",
      },
      "tag-to": {
        hidden: true,
        type: "string",
        desc: "A git tag that determines the upper bound of the range of commits",
      },
    })
    .example("lerna-changelog", "create a changelog for the changes after the latest available tag")
    .example(
      "lerna-changelog --from=0.1.0 --to=0.3.0",
      "create a changelog for the changes in all tags within the given range"
    )
    .epilog("For more information, see https://github.com/lerna/lerna-changelog")
    .wrap(Math.min(100, yargs.terminalWidth()))
    .parse();

  let options = {
    tagFrom: argv["from"] || argv["tag-from"],
    tagTo: argv["to"] || argv["tag-to"],
  };

  try {
    let result = await new Changelog().createMarkdown(options);

    let highlighted = highlight(result, {
      language: "Markdown",
      theme: {
        section: chalk.bold,
        string: chalk.hex("#0366d6"),
        link: chalk.dim,
      },
    });

    console.log(highlighted);
  } catch (e) {
    if (e instanceof ConfigurationError) {
      console.log(chalk.red(e.message));
    } else {
      console.log(chalk.red(e.stack));
    }
  }
}
