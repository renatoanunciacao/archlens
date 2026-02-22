import type { Report } from "./types.js";
export declare function analyzeProject(params: {
    cwd: string;
    projectName: string;
    entryGlobs: string[];
    excludeGlobs: string[];
}): Promise<Report>;
