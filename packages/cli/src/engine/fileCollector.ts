import fg from "fast-glob";

export async function collectFiles(params: {
  cwd: string;
  entryGlobs: string[];
  excludeGlobs: string[];
}): Promise<string[]> {
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