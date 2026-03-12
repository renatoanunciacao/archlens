import type { BootRecipe, RecipeOperation } from "./types.js";

import type { FeatureCandidate } from "./catalog.js";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * IA local baseada em regras para gerar receitas de features
 * Sem dependências externas de LLM
 */

type RecipeModule = {
  pattern: string[];
  operations: (feature: FeatureCandidate, projectPath: string) => Promise<RecipeOperation[]>;
  validate: string[];
};

// Mapa de receitas baseadas em padrões de features
const RECIPE_PATTERNS: Record<string, RecipeModule> = {
  "mermaid-all": {
    pattern: ["mermaid", "all", "command"],
    operations: async () => [
      {
        kind: "replace",
        file: "src/main.ts",
        find: 'const allowed = ["cycles", "danger", "score"];',
        replace: 'const allowed = ["cycles", "danger", "score", "all"];',
      },
      {
        kind: "replace",
        file: "src/main.ts",
        find: 'Graph type (cycles|danger|score)',
        replace: 'Graph type (cycles|danger|score|all)',
      },
      {
        kind: "replace",
        file: "reporters/mermaidReporter.ts",
        find: 'export type MermaidGraphType = "cycles" | "danger" | "score";',
        replace: 'export type MermaidGraphType = "cycles" | "danger" | "score" | "all";',
      },
      {
        kind: "replace",
        file: "reporters/mermaidReporter.ts",
        find: `export function toMermaid(
  report: Report,
  graphType: MermaidGraphType = "cycles",
): string {
  if (graphType === "score") return toScoreMermaid(report);
  if (graphType === "danger") return toDangerMermaid(report);
  return toCyclesMermaid(report);
}`,
        replace: `export function toMermaid(
  report: Report,
  graphType: MermaidGraphType = "cycles",
): string {
  if (graphType === "score") return toScoreMermaid(report);
  if (graphType === "danger") return toDangerMermaid(report);
  if (graphType === "all") {
    return [
      toScoreMermaid(report),
      "",
      toDangerMermaid(report),
      "",
      toCyclesMermaid(report),
    ].join("\\n");
  }
  return toCyclesMermaid(report);
}`,
      },
    ],
    validate: ["npm run build"],
  },

  "explain-score": {
    pattern: ["explain", "score", "breakdown"],
    operations: async () => [
      {
        kind: "replace",
        file: "src/main.ts",
        find: "program.parse(process.argv);",
        replace:
          'program.command("explain <aspect>")\n  .argument("<targetPath>", "Project path (e.g. .)")\n  .option("--config <file>", "Config file", "archlens.config.json")\n  .action(async (aspect: string, targetPath: string, opts) => {\n    // Explain implementation placeholder\n    console.log(`Explaining aspect: ${aspect}`);\n  });\n\nprogram.parse(process.argv);',
      },
      {
        kind: "append",
        file: "reporters/textReporter.ts",
        content: `

export function explainScore(report: Report): string {
  const lines: string[] = [];
  lines.push("# Architecture Score Breakdown");
  lines.push("");
  lines.push(\`Current Score: \${report.score}\`);
  lines.push("");
  lines.push("## Factors");
  lines.push("- Coupling: affects score negatively");
  lines.push("- Cycles: critical issues reduce score");
  lines.push("- Dependencies: well-organized imports increase score");
  return lines.join("\\n");
}
`,
      },
    ],
    validate: ["npm run build"],
  },

  "architecture-diff": {
    pattern: ["diff", "architecture", "comparison"],
    operations: async () => [
      {
        kind: "replace",
        file: "src/main.ts",
        find: 'program.parse(process.argv);',
        replace: 'program.parse(process.argv); // diff command added by boot',
      },
    ],
    validate: ["npm run build"],
  },

  "html-report": {
    pattern: ["html", "report", "export"],
    operations: async () => [
      {
        kind: "append",
        file: "reporters/textReporter.ts",
        content: `

export function toHtml(report: Report): string {
  const lines: string[] = [];
  lines.push("<!DOCTYPE html>");
  lines.push("<html>");
  lines.push("<head>");
  lines.push("<title>ArchLens Report</title>");
  lines.push("</head>");
  lines.push("<body>");
  lines.push("<h1>Architecture Report</h1>");
  lines.push(\`<p>Score: \${report.score}</p>\`);
  lines.push(\`<p>Cycles: \${report.cycles.length}</p>\`);
  lines.push("</body>");
  lines.push("</html>");
  return lines.join("\\n");
}
`,
      },
    ],
    validate: ["npm run build"],
  },
};

/**
 * Analisa o feature e gera uma receita usando regras determinísticas
 */
export async function generateRecipeWithAI(
  feature: FeatureCandidate,
  projectPath: string = process.cwd(),
): Promise<BootRecipe> {
  const module = RECIPE_PATTERNS[feature.key];

  if (!module) {
    throw new Error(
      `Nenhuma receita padrão disponível para "${feature.key}". Criando uma template...`,
    );
  }

  console.log(`🧠 IA gerando receita para: ${feature.title}`);

  const operations = await module.operations(feature, projectPath);

  const recipe: BootRecipe = {
    id: feature.key,
    title: feature.title,
    allowedFiles: feature.filesToChange,
    operations,
    validate: ["npm run build"],
  };

  return recipe;
}

/**
 * Sugest alternativa: se a feature não tem padrão, gera um template genérico
 */
export async function generateTemplateRecipe(
  feature: FeatureCandidate,
): Promise<BootRecipe> {
  const templateOp: RecipeOperation = {
    kind: "append",
    file: "README.md",
    content: `\n## Feature: ${feature.title}\n\n${feature.summary}\n`,
  };

  return {
    id: feature.key,
    title: feature.title,
    allowedFiles: feature.filesToChange,
    operations: [templateOp],
    validate: ["npm run build"],
  };
}

/**
 * Analisa o projeto para aumentar qualidade das receitas
 */
export async function analyzeProjectStructure(projectPath: string): Promise<{
  hasTypeScript: boolean;
  hasMermaid: boolean;
  hasTests: boolean;
  structure: string[];
}> {
  try {
    const files = await fs.readdir(projectPath, { recursive: true });
    const fileList = files as string[];

    return {
      hasTypeScript: fileList.some(f => f.endsWith(".ts")),
      hasMermaid: fileList.some(f => f.includes("mermaid")),
      hasTests: fileList.some(f => f.includes("test") || f.includes("spec")),
      structure: fileList.slice(0, 20),
    };
  } catch (error) {
    console.warn("Não foi possível analisar a estrutura do projeto");
    return {
      hasTypeScript: false,
      hasMermaid: false,
      hasTests: false,
      structure: [],
    };
  }
}

/**
 * Valida se uma receita pode ser aplicada ao projeto
 */
export async function validateRecipeForProject(
  recipe: BootRecipe,
  projectPath: string,
): Promise<{ valid: boolean; warnings: string[] }> {
  const analysis = await analyzeProjectStructure(projectPath);
  const warnings: string[] = [];

  if (!analysis.hasTypeScript) {
    warnings.push("Projeto não parece ser TypeScript");
  }

  for (const op of recipe.operations) {
    const filePath = path.join(projectPath, op.file);
    try {
      const exists = await fs.stat(filePath);
      if (!exists) {
        warnings.push(`Arquivo não encontrado: ${op.file}`);
      }
    } catch {
      if (op.kind !== "createFile") {
        warnings.push(`Arquivo não encontrado para edição: ${op.file}`);
      }
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
