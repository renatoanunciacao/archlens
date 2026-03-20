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
    if (normalized === "rules") {
      const hasViolations = (report as any).rules?.violations?.length > 0;
      if (hasViolations) {
        violations.push({
          rule,
          metric: "rules",
          operator: "",
          expected: 0,
          actual: (report as any).rules.violations.length,
          message: `rules violated: ${(report as any).rules.violations.length}`,
        });
      }
      continue;
    }

    const match = normalized.match(/^(score|cycles|danger)(<=|>=|<|>|==)(\d+)$/);

    if (!match) {
      throw new Error(
        `Invalid --fail-on rule: "${rule}". Supported examples: score<80, cycles>0, danger>2, rules`,
      );
    }

    const [, metric, operator, rawValue] = match;
    const expected = Number(rawValue);

    let actual: number;
    if (metric === "score") {
      actual = report.score.value;
    } else if(metric === "cycles") {
      actual = report.cycles.length;
    } else if(metric === "danger") {
      actual = report.metrics.danger.length;
    } else {
      throw new Error(`Unsupported metric: ${metric}`);
    }

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