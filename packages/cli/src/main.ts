#!/usr/bin/env node

import { Command } from "commander";
import { analyzeProject } from "./engine/index.js";
import { evaluateFailOn } from "./failOn.js";
import fs from "node:fs/promises";
import path from "node:path";
import { toJson } from "../reporters/jsonReporter.js";
import { toMermaid } from "../reporters/mermaidReporter.js";
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
  .version("0.2.3");

program
  .command("analyze")
  .argument("<targetPath>", "Project path (e.g. .)")
  .option("--config <file>", "Config file", "archlens.config.json")
  .option("--out <dir>", "Output directory", "./archlens-report")
  .option("--format <type>", "Output format (text|json)", "text")
  .option("--output <file>", "Write output to file")
  .option(
    "--fail-on <rule>",
    "Fail when rule matches (e.g. score<80, cycles>0)",
  )
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
    let content: string;

    if (opts.format === "json") {
      content = toJson(report);
    } else {
      content = toText(report);
    }

    let failResult = null;

    if (opts.failOn) {
      failResult = evaluateFailOn(opts.failOn, report);
    }

    if (opts.output) {
      const outputPath = path.resolve(process.cwd(), opts.output);
      const outputDir = path.dirname(outputPath);

      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(outputPath, content, "utf8");

      console.log(`Output written to ${outputPath}`);
      return;
    } else if (format === "json") {
      await fs.mkdir(outDir, { recursive: true });

      const jsonPath = path.join(outDir, "report.json");
      await fs.writeFile(jsonPath, content, "utf8");

      console.log(`Report written to ${jsonPath}`);
      return;
    } else {
      console.log(`\n${content}\n`);
    }

    if (failResult?.matched) {
      console.error("\n❌ Architecture rule violation");

      for (const violation of failResult.violations) {
        console.error(` - ${violation.message}`);
      }

      process.exit(1);
    }
  });

program
  .command("mermaid")
  .argument("<graphType>", "Graph type (cycles|danger|score)")
  .argument("<targetPath>", "Project path (e.g. .)")
  .option("--config <file>", "Config file", "archlens.config.json")
  .option("--output <file>", "Write output to file")
  .action(async (graphType: string, targetPath: string, opts) => {
    const allowed = ["cycles", "danger", "score", "all"];

    if (!allowed.includes(graphType)) {
      console.error(
        `Invalid graph type "${graphType}". Use one of: ${allowed.join(", ")}`,
      );
      process.exit(1);
    }

    const cwd = path.resolve(process.cwd(), targetPath);
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

    const content = toMermaid(report, graphType as "cycles" | "danger" | "score");

    if (opts.output) {
      const outputPath = path.resolve(process.cwd(), opts.output);
      const outputDir = path.dirname(outputPath);

      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(outputPath, content, "utf8");

      console.log(`Output written to ${outputPath}`);
      return;
    }

    console.log(`\n${content}\n`);
  });

program.command("explain <aspect>")
  .argument("<targetPath>", "Project path (e.g. .)")
  .option("--config <file>", "Config file", "archlens.config.json")
  .action(async (aspect: string, targetPath: string, opts) => {
    // Explain implementation placeholder
    console.log(`Explaining aspect: ${aspect}`);
  });

program.command("diff")
  .argument("<baseReport>", "Base report JSON file")
  .argument("<headReport>", "Head report JSON file (new)")
  .action(async (baseReportPath: string, headReportPath: string) => {
    try {
      const basePath = path.resolve(process.cwd(), baseReportPath);
      const headPath = path.resolve(process.cwd(), headReportPath);

      const baseContent = await fs.readFile(basePath, "utf8");
      const headContent = await fs.readFile(headPath, "utf8");

      const baseReport = JSON.parse(baseContent);
      const headReport = JSON.parse(headContent);

      console.log("\n📊 Architecture Diff Report\n");

      // Score delta
      const baseSc = baseReport.score?.value ?? baseReport.score ?? 0;
      const headSc = headReport.score?.value ?? headReport.score ?? 0;
      const scoreDelta = headSc - baseSc;
      const scoreSign = scoreDelta >= 0 ? "+" : "";
      console.log(`Score: ${baseSc} → ${headSc}  (${scoreSign}${scoreDelta})`);

      // Cycles delta
      const baseCycles = baseReport.cycles?.length ?? 0;
      const headCycles = headReport.cycles?.length ?? 0;
      const cyclesDelta = headCycles - baseCycles;
      const cyclesSign = cyclesDelta >= 0 ? "+" : "";
      console.log(`Cycles: ${baseCycles} → ${headCycles}  (${cyclesSign}${cyclesDelta})`);

      // Danger count delta
      const baseDanger = baseReport.metrics?.danger?.length ?? 0;
      const headDanger = headReport.metrics?.danger?.length ?? 0;
      const dangerDelta = headDanger - baseDanger;
      const dangerSign = dangerDelta >= 0 ? "+" : "";
      console.log(`Danger hotspots: ${baseDanger} → ${headDanger}  (${dangerSign}${dangerDelta})`);

      // File count
      const baseFiles = baseReport.meta?.fileCount ?? 0;
      const headFiles = headReport.meta?.fileCount ?? 0;
      const filesDelta = headFiles - baseFiles;
      const filesSign = filesDelta >= 0 ? "+" : "";
      console.log(`Files analyzed: ${baseFiles} → ${headFiles}  (${filesSign}${filesDelta})\n`);

      // Summary
      if (scoreDelta > 0) {
        console.log("✅ Architecture improved!");
      } else if (scoreDelta < 0) {
        console.log("⚠️  Architecture regressed!");
      } else {
        console.log("➡️  No change in architecture score");
      }
    } catch (err: any) {
      console.error("Error reading or parsing reports:", err.message);
      process.exit(1);
    }
  });

program.command("html")
  .argument("[targetPath]", "Project path (e.g. .)", ".")
  .option("--config <file>", "Config file", "archlens.config.json")
  .option("--output <file>", "Output HTML file", "archlens-report.html")
  .action(async (targetPath: string, opts) => {
    const cwd = path.resolve(process.cwd(), targetPath);
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

    const { toHtml } = await import("../reporters/textReporter.js");
    const content = toHtml(report);

    const outputPath = path.resolve(process.cwd(), opts.output);
    const outputDir = path.dirname(outputPath);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, content, "utf8");

    console.log(`\n✅ HTML report generated: ${outputPath}\n`);
  });

program.parse(process.argv);