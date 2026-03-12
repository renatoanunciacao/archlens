import type { BootGoal, BootRecommendation } from "./types.js";

export function formatBootRecommendation(
  goal: BootGoal,
  rec: BootRecommendation,
): string {
  return [
    "🚀 ArchLens Boot Recommendation",
    `Goal: ${goal}`,
    "",
    `Recommended feature:`,
    `  ${rec.title}`,
    "",
    "Summary:",
    `  ${rec.summary}`,
    "",
    "Why now:",
    ...rec.rationale.map((item) => `  - ${item}`),
    "",
    `Expected impact: ${rec.impact}`,
    `Estimated effort: ${rec.effort}`,
    "",
    "Files to change:",
    ...rec.filesToChange.map((item) => `  - ${item}`),
    "",
    "Implementation steps:",
    ...rec.implementationSteps.map((item, index) => `  ${index + 1}. ${item}`),
    "",
    "Acceptance criteria:",
    ...rec.acceptanceCriteria.map((item) => `  - ${item}`),
  ].join("\n");
}