import fg from "fast-glob";
export async function collectFiles(params) {
    const { cwd, entryGlobs, excludeGlobs } = params;
    const files = await fg(entryGlobs, {
        cwd,
        ignore: excludeGlobs,
        onlyFiles: true,
        dot: false,
        unique: true,
        absolute: false
    });
    return files.map((p) => p.replaceAll("\\", "/")).sort();
}
