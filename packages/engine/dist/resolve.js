import path from "node:path";
export function isRelative(spec) {
    return spec.startsWith(".") || spec.startsWith("/");
}
export function candidatePaths(fromFile, spec) {
    const fromDir = path.posix.dirname(fromFile);
    const base = spec.startsWith("/")
        ? path.posix.normalize(spec.slice(1))
        : path.posix.normalize(path.posix.join(fromDir, spec));
    return [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.js`,
        `${base}.jsx`,
        `${base}.mjs`,
        `${base}.cjs`,
        `${base}/index.ts`,
        `${base}/index.tsx`,
        `${base}/index.js`,
        `${base}/index.jsx`
    ].map((p) => p.replaceAll("\\", "/"));
}
