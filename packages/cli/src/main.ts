#!/usr/bin/env node

import { Command } from "commander";
import { analyzeProject } from "./engine/index.js";
import fs from "node:fs/promises";
import path from "node:path";
import { toJson } from "../reporters/jsonReporter.js";
import { toText } from "../reporters/textReporter.js";

type ArchLensCliConfig = {
  projectName?: string;
  entryGlobs?: string[];
  excludeGlobs?: string[];
};

const program = new Command();

program
  .name("archlens")
  .description("Architecture health analyzer for JS/TS projects")
  .version("0.1.0");

program
  .command("analyze")
  .argument("<targetPath>", "Project path (e.g. .)")
  .option("--config <file>", "Config file", "archlens.config.json")
  .option("--out <dir>", "Output directory", "./archlens-report")
  .option("--format <type>", "Output format (text|json)", "text")
  .option("--output <file>", "Write output to file")
  .action(async (targetPath: string, opts) => {
    const cwd = path.resolve(process.cwd(), targetPath);
    const outDir = path.resolve(process.cwd(), opts.out);
    const configPath = path.resolve(cwd, opts.config);

    const defaults: Required<
      Pick<ArchLensCliConfig, "entryGlobs" | "excludeGlobs">
    > = {
      entryGlobs: ["src/**/*.{ts,tsx,js,jsx}"],
      excludeGlobs: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/coverage/**",
      ],
    };

    let cfg: ArchLensCliConfig = {};
    try {
      cfg = JSON.parse(await fs.readFile(configPath, "utf8"));
    } catch {
      cfg = {};
    }

    const projectName = cfg.projectName ?? path.basename(cwd);
    const entryGlobs = cfg.entryGlobs ?? defaults.entryGlobs;
    const excludeGlobs = cfg.excludeGlobs ?? defaults.excludeGlobs;

    const report = await analyzeProject({
      cwd,
      projectName,
      entryGlobs,
      excludeGlobs,
    });

    const format = opts.format === "json" ? "json" : "text";
    const content = format === "json" ? toJson(report) : toText(report);

    if (opts.output) {
      const outputPath = path.resolve(process.cwd(), opts.output);
      const outputDir = path.dirname(outputPath);

      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(outputPath, content, "utf8");

      console.log(`Output written to ${outputPath}`);
      return;
    }

    if (format === "json") {
      await fs.mkdir(outDir, { recursive: true });

      const jsonPath = path.join(outDir, "report.json");
      await fs.writeFile(jsonPath, content, "utf8");

      console.log(`Report written to ${jsonPath}`);
      return;
    }

    console.log(`\n${content}\n`);
  });

program.parse(process.argv);