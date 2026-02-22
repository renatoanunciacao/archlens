#!/usr/bin/env node

import { Command } from "commander";
import { analyzeProject } from "@archlens/engine";
import fs from "node:fs/promises";
import path from "node:path";

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
  .argument("<targetPath>", "Path do projeto (ex: .)")
  .option("--config <file>", "Arquivo de config", "archlens.config.json")
  .option("--out <dir>", "Pasta de saída", "./archlens-report")
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
      // config é opcional: se não existir, usa defaults
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

    await fs.mkdir(outDir, { recursive: true });

    const jsonPath = path.join(outDir, "report.json");
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");

    console.log(`\n✅ ArchLens analysis complete`);
    console.log(`Project: ${report.meta.projectName}`);
    console.log(`Files analyzed: ${report.meta.fileCount}`);
    console.log(`Edges: ${report.graph.edges.length}`);

    console.log(
      `Architecture Health Score: ${report.score.value}/100 (${report.score.grade})`,
    );
    console.log(`Status: ${report.score.status}`);

    const penalties = report.score.breakdown.filter((b) => b.points < 0);
    if (penalties.length) {
      console.log("\nScore breakdown (penalties):");
      for (const p of penalties) {
        console.log(`  ${p.points}  ${p.details}`);
      }
    }

    const topIn = report.metrics.topFanIn.slice(0, 3);
    const topOut = report.metrics.topFanOut.slice(0, 3);
    const danger = report.metrics.danger.slice(0, 3);

    console.log("Top Fan-in (críticos):");
    for (const m of topIn)
      console.log(`  - ${m.fanIn} in  | ${m.fanOut} out | ${m.file}`);

    console.log("Top Fan-out (instáveis):");
    for (const m of topOut)
      console.log(`  - ${m.fanIn} in  | ${m.fanOut} out | ${m.file}`);

    console.log("Danger (acoplados):");
    for (const m of danger)
      console.log(`  - ${m.fanIn} in  | ${m.fanOut} out | ${m.file}`);

    if (report.cycles.length) {
      console.log(`Cycles detected: ${report.cycles.length}`);
      console.log(
        `  - ${report.cycles[0].id}: ${report.cycles[0].nodes.join(" -> ")}`,
      );
    }

    console.log(`Report: ${jsonPath}\n`);
  });

program.parse(process.argv);
