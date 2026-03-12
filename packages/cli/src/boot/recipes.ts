import type { BootRecipe, BootRecommendation } from "./types.js";

export function buildRecipe(
  id: string,
  recommendation: BootRecommendation,
): BootRecipe {
  if (recommendation.title === "Mermaid all command") {
    return {
      id,
      title: recommendation.title,
      allowedFiles: ["src/cli/main.ts", "reporters/mermaidReporter.ts"],
      operations: [
        {
          kind: "replace",
          file: "src/cli/main.ts",
          find: 'const allowed = ["cycles", "danger", "score"];',
          replace: 'const allowed = ["cycles", "danger", "score", "all"];',
        },
        {
          kind: "replace",
          file: "src/cli/main.ts",
          find: 'Graph type (cycles|danger|score)',
          replace: 'Graph type (cycles|danger|score|all)',
        },
        {
          kind: "replace",
          file: "reporters/mermaidReporter.ts",
          find: 'export type MermaidGraphType = "cycles" | "danger" | "score";',
          replace:
            'export type MermaidGraphType = "cycles" | "danger" | "score" | "all";',
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
    };
  }

  throw new Error(`No recipe builder found for "${recommendation.title}"`);
}