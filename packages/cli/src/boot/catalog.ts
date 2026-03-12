import type { BootGoal } from "./types.js";

export type FeatureCandidate = {
  key: string;
  title: string;
  summary: string;
  goal: BootGoal;
  rationale: string[];
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  filesToChange: string[];
  implementationSteps: string[];
  acceptanceCriteria: string[];
  tags: string[];
  prerequisites?: string[];
};

export const FEATURE_CATALOG: FeatureCandidate[] = [
  {
    key: "architecture-diff",
    title: "Architecture diff command",
    summary:
      "Add a diff command to compare architecture health between two states or branches.",
    goal: "next-feature",
    rationale: [
      "Users need trend visibility, not only a point-in-time analysis.",
      "Diff is a strong product capability for CI and reviews.",
    ],
    impact: "high",
    effort: "high",
    filesToChange: ["src/main.ts"],
    implementationSteps: [
      "Add diff command entrypoint.",
      "Define comparison model for reports.",
      "Render before/after changes.",
      "Validate with build.",
    ],
    acceptanceCriteria: [
      "archlens diff runs successfully",
      "Output shows architectural changes",
    ],
    tags: ["cli", "comparison", "analysis"],
  },
  {
    key: "html-report",
    title: "HTML report export",
    summary:
      "Add an HTML export for architecture reports to improve sharing and presentation.",
    goal: "release-ready",
    rationale: [
      "HTML output improves demo quality and stakeholder sharing.",
      "Presentation format increases product readiness.",
    ],
    impact: "medium",
    effort: "medium",
    filesToChange: ["reporters/textReporter.ts"],
    implementationSteps: [
      "Create HTML reporter.",
      "Wire command/output option.",
      "Validate with build.",
    ],
    acceptanceCriteria: [
      "HTML report can be generated",
      "Exported report is readable and complete",
    ],
    tags: ["reporting", "export", "release"],
  },
];