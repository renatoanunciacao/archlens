import type { Report, Score } from "./types.js";
export declare function computeScore(input: {
    cycles: {
        id: string;
        nodes: string[];
    }[];
    metrics: Report["metrics"];
}): Score;
