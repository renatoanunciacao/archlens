import type { Report, Score, ScoreBreakdownItem } from "./types.js";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function gradeFromScore(v: number): Score["grade"] {
  if (v >= 90) return "A";
  if (v >= 80) return "B";
  if (v >= 70) return "C";
  if (v >= 60) return "D";
  return "F";
}

function statusFromScore(v: number): Score["status"] {
  if (v >= 80) return "Healthy";
  if (v >= 60) return "Warning";
  return "Critical";
}

export function computeScore(input: {
  cycles: { id: string; nodes: string[] }[];
  metrics: Report["metrics"];
}): Score {
  const breakdown: ScoreBreakdownItem[] = [];
  let totalPenalty = 0;

  // 1) Cycles
  const cycleCount = input.cycles.length;
  const cycleNodesTotal = input.cycles.reduce((acc, c) => acc + c.nodes.length, 0);

  if (cycleCount > 0) {
    const penalty = -(cycleCount * 15 + cycleNodesTotal * 2);
    totalPenalty += penalty;
    breakdown.push({
      key: "cycles",
      points: penalty,
      details: `Detected ${cycleCount} cycle(s) involving ${cycleNodesTotal} file(s)`
    });
  } else {
    breakdown.push({
      key: "cycles",
      points: 0,
      details: "No dependency cycles detected"
    });
  }

  // 2) Danger modules (fanIn * fanOut)
  const danger4 = input.metrics.perFile.filter((m) => (m.dangerScore ?? (m.fanIn * m.fanOut)) >= 4);
  const danger9 = input.metrics.perFile.filter((m) => (m.dangerScore ?? (m.fanIn * m.fanOut)) >= 9);

  // Evita penalizar duas vezes o mesmo arquivo no threshold menor
  const danger4Only = danger4.filter((m) => (m.dangerScore ?? (m.fanIn * m.fanOut)) < 9);

  if (danger4Only.length > 0) {
    const penalty = -(danger4Only.length * 2);
    totalPenalty += penalty;
    breakdown.push({
      key: "danger>=4",
      points: penalty,
      details: `${danger4Only.length} module(s) have elevated coupling (dangerScore ≥ 4)`
    });
  } else {
    breakdown.push({
      key: "danger>=4",
      points: 0,
      details: "No elevated coupling hotspots (dangerScore ≥ 4)"
    });
  }

  if (danger9.length > 0) {
    const penalty = -(danger9.length * 4);
    totalPenalty += penalty;
    breakdown.push({
      key: "danger>=9",
      points: penalty,
      details: `${danger9.length} module(s) are strong coupling hotspots (dangerScore ≥ 9)`
    });
  } else {
    breakdown.push({
      key: "danger>=9",
      points: 0,
      details: "No strong coupling hotspots (dangerScore ≥ 9)"
    });
  }

  // 3) High fan-out
  const fanOut10 = input.metrics.perFile.filter((m) => m.fanOut >= 10 && m.fanOut < 20);
  const fanOut20 = input.metrics.perFile.filter((m) => m.fanOut >= 20);

  if (fanOut10.length > 0) {
    const penalty = -(fanOut10.length * 2);
    totalPenalty += penalty;
    breakdown.push({
      key: "fanOut>=10",
      points: penalty,
      details: `${fanOut10.length} module(s) depend on 10–19 internal modules (fanOut ≥ 10)`
    });
  } else {
    breakdown.push({
      key: "fanOut>=10",
      points: 0,
      details: "No modules with very high fanOut (≥ 10)"
    });
  }

  if (fanOut20.length > 0) {
    const penalty = -(fanOut20.length * 4);
    totalPenalty += penalty;
    breakdown.push({
      key: "fanOut>=20",
      points: penalty,
      details: `${fanOut20.length} module(s) depend on 20+ internal modules (fanOut ≥ 20)`
    });
  } else {
    breakdown.push({
      key: "fanOut>=20",
      points: 0,
      details: "No modules with extreme fanOut (≥ 20)"
    });
  }

  const value = clamp(100 + totalPenalty, 0, 100);

  return {
    value,
    grade: gradeFromScore(value),
    status: statusFromScore(value),
    breakdown
  };
}