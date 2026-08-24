#!/usr/bin/env node
import { Command } from "commander";
import { runTestCommand } from "./commands/test.js";

const program = new Command();

program
  .name("contextmeter")
  .description("Context regression testing for AI agents — CI for what your agent knows.")
  .version("1.0.0");

program
  .command("test", { isDefault: true })
  .description(
    "Run context analysis + replay against a contextmeter.config.json and exit non-zero on regression"
  )
  .option("-c, --config <path>", "path to config file", "./contextmeter.config.json")
  .action(async (opts: { config: string }) => {
    process.exitCode = await runTestCommand({ config: opts.config });
  });

void program.parseAsync(process.argv);
