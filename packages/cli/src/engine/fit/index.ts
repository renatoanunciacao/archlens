/**
 * Fit Engine Public API
 */

export type {
  ArchitectureFit,
  FitEvaluationContext,
  FitCheckFunction,
  FitCheck,
  FitStatus,
  CheckStatus,
} from "./types.js";

export { evaluateFit, buildFitEvaluationContext } from "./engine.js";
export { getChecksForProfile } from "./checks/index.js";
