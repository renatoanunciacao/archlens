/**
 * Architecture Fit Detection Types
 * 
 * Defines structures for evaluating how well a project adheres
 * to its recommended architecture profile
 */

/**
 * Status of architecture fit to profile
 */
export type FitStatus = "good" | "partial" | "poor";

/**
 * Check status within fit evaluation
 */
export type CheckStatus = "ok" | "warning" | "fail";

/**
 * Individual check result in fit evaluation
 */
export type FitCheck = {
  /** Check name/identifier */
  name: string;
  
  /** Check status */
  status: CheckStatus;
  
  /** Detailed explanation of check result */
  description: string;
};

/**
 * Overall architecture fit evaluation
 * Compares recommended profile against detected structure
 */
export type ArchitectureFit = {
  /** Profile being evaluated against */
  profile: string;

  /** Overall fit status */
  status: FitStatus;

  /** Fit score 0-100 (how well project adheres to profile) */
  score: number;

  /** Layers detected in the project */
  detectedLayers: string[];

  /** Layers expected by profile but not found */
  missingLayers: string[];

  /** Layers found but not expected in profile */
  unexpectedLayers: string[];

  /** Individual check results */
  checks: FitCheck[];
};

/**
 * Context for fit evaluation
 */
export type FitEvaluationContext = {
  /** Project structure */
  structure: {
    layers: string[];
    modules: string[];
    detectedLayersPerFile: Record<string, string>;
  };

  /** Dependency graph */
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

  /** Computed metrics */
  metrics: {
    fanIn: Array<{ file: string; count: number }>;
    fanOut: Array<{ file: string; count: number }>;
    cycles: Array<string[]>;
    hotspots: Array<{ file: string; dangerScore: number }>;
  };

  /** Recommended profile */
  profile: {
    id: string;
    name: string;
    expectedLayers: string[];
    projectKind: "frontend" | "backend" | "fullstack";
  };

  /** Project classification */
  fingerprint: {
    framework: "next" | "vite" | "node" | "unknown";
    projectKind: "frontend" | "backend" | "fullstack";
  };
};

/**
 * Fit check function
 */
export type FitCheckFunction = (
  context: FitEvaluationContext
) => FitCheck;

/**
 * Registry of fit checks by profile
 */
export type FitChecksRegistry = {
  common: FitCheckFunction[];
  [profileId: string]: FitCheckFunction[];
};
