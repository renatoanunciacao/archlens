import fs from "node:fs/promises";
import path from "node:path";

export type ProjectFingerprint = {
  framework: "next" | "vite" | "node" | "unknown";
  uiFramework?: "react" | "vue" | "svelte";
  router?: "app-router" | "pages-router";
  projectKind: "frontend" | "backend" | "fullstack";
  confidence: number;
  signals: string[];
};

async function exists(file: string): Promise<boolean> {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

function hasDependency(pkg: any, dep: string): boolean {
  return (
    (pkg.dependencies && pkg.dependencies[dep]) ||
    (pkg.devDependencies && pkg.devDependencies[dep])
  );
}

export async function detectProject(projectRoot: string): Promise<ProjectFingerprint> {
  const signals: string[] = [];

  const pkgPath = path.join(projectRoot, "package.json");
  let pkg: any = {};
  try {
    const raw = await fs.readFile(pkgPath, "utf8");
    pkg = JSON.parse(raw);
    signals.push("has package.json");
  } catch {
    // ignore
  }

  const hasNextConfig =
    (await exists(path.join(projectRoot, "next.config.js"))) ||
    (await exists(path.join(projectRoot, "next.config.ts")));
  const hasViteConfig =
    (await exists(path.join(projectRoot, "vite.config.js"))) ||
    (await exists(path.join(projectRoot, "vite.config.ts")));

  const hasAppDir =
    (await exists(path.join(projectRoot, "app"))) ||
    (await exists(path.join(projectRoot, "src", "app")));

  const hasPages =
    (await exists(path.join(projectRoot, "pages"))) ||
    (await exists(path.join(projectRoot, "src", "pages")));

  const hasIndexHtml = await exists(path.join(projectRoot, "index.html"));
  const hasSrcMainTsx = await exists(path.join(projectRoot, "src", "main.tsx"));
  const hasSrcMainTs = await exists(path.join(projectRoot, "src", "main.ts"));

  const hasControllers = await exists(path.join(projectRoot, "controllers"));
  const hasServices = await exists(path.join(projectRoot, "services"));
  const hasRepositories = await exists(path.join(projectRoot, "repositories"));

  const depNext = hasDependency(pkg, "next");
  const depVite = hasDependency(pkg, "vite");
  const depReact = hasDependency(pkg, "react");
  const depVue = hasDependency(pkg, "vue");
  const depSvelte = hasDependency(pkg, "svelte");

  const depExpress = hasDependency(pkg, "express");
  const depFastify = hasDependency(pkg, "fastify");
  const depKoa = hasDependency(pkg, "koa");
  const depNest = hasDependency(pkg, "@nestjs/core");

  let framework: ProjectFingerprint["framework"] = "unknown";
  let uiFramework: ProjectFingerprint["uiFramework"] | undefined = undefined;
  let router: ProjectFingerprint["router"] | undefined = undefined;
  let projectKind: ProjectFingerprint["projectKind"] = "backend";

  // Next.js detection
  if (hasNextConfig || depNext) {
    framework = "next";
    projectKind = "fullstack";
    signals.push("next detected");

    if (hasAppDir) {
      router = "app-router";
      signals.push("app router detected");
    } else if (hasPages) {
      router = "pages-router";
      signals.push("pages router detected");
    }

    if (depReact) {
      uiFramework = "react";
      signals.push("react detected");
    }
  }

  // Vite detection
  if (framework === "unknown" && (hasViteConfig || depVite)) {
    framework = "vite";
    projectKind = "frontend";
    signals.push("vite detected");

    if (depReact) {
      uiFramework = "react";
      signals.push("react detected");
    }
    if (depVue) {
      uiFramework = "vue";
      signals.push("vue detected");
    }
    if (depSvelte) {
      uiFramework = "svelte";
      signals.push("svelte detected");
    }
  }

  // Node/backend detection
  const hasNodeServer = depExpress || depFastify || depKoa || depNest;
  const hasBackendFolders = hasControllers || hasServices || hasRepositories;

  if (framework === "unknown" && (hasNodeServer || hasBackendFolders)) {
    framework = "node";
    projectKind = "backend";
    signals.push("node backend detected");

    if (hasBackendFolders) {
      signals.push("backend folder structure detected");
    }
  }

  // adjust fullstack if vite + backend
  if (framework === "vite" && (hasNodeServer || hasBackendFolders)) {
    projectKind = "fullstack";
    signals.push("fullstack patterns detected");
  }

  // if nothing detected, default values
  if (framework === "unknown") {
    signals.push("no framework detected");
  }

  const confidence = Math.min(1, signals.length / 6);

  return {
    framework,
    uiFramework,
    router,
    projectKind,
    confidence,
    signals,
  };
}
