/**
 * Architecture Problem Detection Types
 * 
 * This module defines the core data structures for representing
 * architecture problems detected in a project.
 */

/**
 * Severity level of an architecture problem
 */
export type ProblemSeverity = "low" | "medium" | "high";

/**
 * Category of architecture problem
 */
export type ProblemCategory = 
  | "layering"      // Violation of layer boundaries
  | "coupling"      // Unwanted dependencies between modules
  | "modularity"    // Poor module structure or organization
  | "boundary"      // Weak architectural boundaries
  | "rules"         // Violation of defined rules
  | "structure";    // General structural issues

/**
 * Represents a concrete architecture problem detected in the project
 */
export type ArchitectureProblem = {
  /** Unique identifier for the problem type */
  id: string;

  /** Human-readable title of the problem */
  title: string;

  /** Severity level: how critical is this issue? */
  severity: ProblemSeverity;

  /** Category of the problem */
  category: ProblemCategory;

  /** Detailed description of what's wrong */
  description: string;

  /** Why this matters for long-term maintainability */
  whyItMatters: string;

  /** Evidence/signals that led to detection */
  evidence: string[];

  /** Files affected by this problem */
  affectedFiles: string[];

  /** Suggested fixes/actions to resolve */
  suggestedFixes: string[];
};

/**
 * Context passed to problem detection heuristics
 */
export type ProblemDetectionContext = {
  graph: {
    nodes: Array<{
      file: string;
      imports: string[];
    }>;
    edges: Array<{
      from: string;
      to: string;
    }>;
  };

  metrics: {
    fanIn: Array<{ file: string; count: number }>;
    fanOut: Array<{ file: string; count: number }>;
    cycles: Array<string[]>;
    hotspots: Array<{ file: string; dangerScore: number }>;
  };

  structure: {
    layers: string[];
    modules: string[];
    detectedLayersPerFile: Record<string, string>;
  };

  profile: {
    id: string;
    name: string;
    expectedLayers: string[];
    projectKind: "frontend" | "backend" | "fullstack";
  };

  fingerprint: {
    framework: "next" | "vite" | "node" | "unknown";
    projectKind: "frontend" | "backend" | "fullstack";
  };

  projectRoot: string;
};

/**
 * Heuristic function that detects a specific problem
 */
export type ProblemHeuristic = {
  id: string;
  name: string;
  category: ProblemCategory;
  
  /**
   * Detect problems in the given context
   * Returns array of 0..N problems found
   */
  detect: (context: ProblemDetectionContext) => ArchitectureProblem[];
};

/**
 * Registry of available heuristics, grouped by profile
 */
export type HeuristicsRegistry = {
  common: ProblemHeuristic[];
  [profileId: string]: ProblemHeuristic[];
};
