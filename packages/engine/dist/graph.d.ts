import type { Edge } from "./types.js";
export declare function buildGraph(params: {
    cwd: string;
    files: string[];
}): Promise<{
    nodes: string[];
    edges: Edge[];
}>;
