export type Edge = {
    from: string;
    to: string;
};
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
};
export type ScoreBreakdownItem = {
    key: string;
    points: number;
    details: string;
};
export type Score = {
    value: number;
    grade: "A" | "B" | "C" | "D" | "F";
    status: "Healthy" | "Warning" | "Critical";
    breakdown: ScoreBreakdownItem[];
};
