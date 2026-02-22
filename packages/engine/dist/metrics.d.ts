import type { Edge, NodeMetrics } from "./types.js";
export declare function computeNodeMetrics(nodes: string[], edges: Edge[]): {
    perFile: NodeMetrics[];
    topFanIn: NodeMetrics[];
    topFanOut: NodeMetrics[];
    danger: NodeMetrics[];
};
