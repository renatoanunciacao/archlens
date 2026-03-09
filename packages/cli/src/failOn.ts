import type { Report } from "./engine/types.js";

type FailOnViolation = {
  rule: string;
  metric: string;
  operator: string;
  expected: number;
  actual: number;
  message: string;
};

type EvaluateFailOnResult = {
  matched: boolean;
  violations: FailOnViolation[];
};

export function evaluateFailOn(
  rules: string,
  report: Report,
): EvaluateFailOnResult {
  const parsedRules = rules
    .split(",")
    .map((rule) => rule.trim())
    .filter(Boolean);

  if (!parsedRules.length) {
    throw new Error("No fail-on rules provided.");
  }

  const violations: FailOnViolation[] = [];

  for (const rule of parsedRules) {
    const normalized = rule.replace(/\s+/g, "");
    const match = normalized.match(/^(score|cycles)(<=|>=|<|>|==)(\d+)$/);

    if (!match) {
      throw new Error(
        `Invalid --fail-on rule: "${rule}". Supported examples: score<80, cycles>0`,
      );
    }

    const [, metric, operator, rawValue] = match;
    const expected = Number(rawValue);

    const actual =
      metric === "score" ? report.score.value : report.cycles.length;

    const triggered = compare(actual, operator, expected);

    if (triggered) {
      violations.push({
        rule,
        metric,
        operator,
        expected,
        actual,
        message: `${metric} ${operator} ${expected} (actual: ${actual})`,
      });
    }
  }

  return {
    matched: violations.length > 0,
    violations,
  };
}

function compare(actual: number, operator: string, expected: number): boolean {
  switch (operator) {
    case "<":
      return actual < expected;
    case "<=":
      return actual <= expected;
    case ">":
      return actual > expected;
    case ">=":
      return actual >= expected;
    case "==":
      return actual === expected;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}