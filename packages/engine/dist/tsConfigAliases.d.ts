export type AliasRule = {
    prefix: string;
    targetPrefix: string;
};
export declare function loadAliasRules(cwd: string): Promise<AliasRule[]>;
export declare function resolveAliasImport(spec: string, rules: AliasRule[]): string | null;
