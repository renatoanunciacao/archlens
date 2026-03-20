export type Edge = { from: string; to: string };

import { RuleViolation } from "./rules/evaluateRules";

export type Cycle = {
  id: string;
  nodes: string[];
};

export type NodeMetrics = {
  file: string;
  fanIn: number;
  fanOut: number;
  instability: number | null;
  dangerScore?: number;
};

export type Report = {
  meta: {
    projectName: string;
    analyzedAt: string;
    fileCount: number;
  };
  graph: {
    nodes: string[];
    edges: Edge[];
  };
  cycles: Cycle[];
  metrics: {
    perFile: NodeMetrics[];
    topFanIn: NodeMetrics[];
    topFanOut: NodeMetrics[];
    danger: NodeMetrics[];
  };
  score: Score;
  rules: {
    total: number;
    violations: RuleViolation[];
  };
  architecture: {
    fingerprint: {
      framework: "next" | "vite" | "node" | "unknown";
      uiFramework?: "react" | "vue" | "svelte";
      router?: "app-router" | "pages-router";
      projectKind: "frontend" | "backend" | "fullstack";
      confidence: number;
      signals: string[];
    };
    recommendation: {
      profile:
        | "next-app-router-feature-based"
        | "vite-feature-spa"
        | "backend-modular-monolith"
        | "backend-clean-architecture";
      recommendedLayers: string[];
      description: string;
    };
  };
};

export type ScoreBreakdownItem = {
  key: string;          
  points: number;
  details: string;
};

export type Score = {
  value: number;        // 0..100
  grade: "A" | "B" | "C" | "D" | "F";
  status: "Healthy" | "Architecture Warning" | "Critical";
  breakdown: ScoreBreakdownItem[];
};

type AnalyzeResult = {
  score: number;
  cycles: unknown[];
  metrics: {
    fanIn: unknown[];
    fanOut: unknown[];
  };
  rules: {
    total: number;
    violations: RuleViolation[];
  };
};