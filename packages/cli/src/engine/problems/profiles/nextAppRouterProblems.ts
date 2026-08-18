/**
 * Next.js App Router Profile Heuristics
 * 
 * Specific problem detection for Next.js projects using app router
 * Looks for patterns that violate Next.js best practices
 */

import type { ArchitectureProblem, ProblemDetectionContext, ProblemHeuristic } from "../types.js";

/**
 * Heuristic: Server-side code in client components
 * Detects "use client" files still importing server-only modules
 */
export const serverCodeInClientComponentHeuristic: ProblemHeuristic = {
  id: "server-code-in-client-component",
  name: "Server-side code in client component",
  category: "boundary",

  detect(context: ProblemDetectionContext): ArchitectureProblem[] {
    const problems: ArchitectureProblem[] = [];

    // Client components
    const clientComponents = context.graph.nodes.filter((node) =>
      node.file.match(/\.(tsx|jsx)$/) &&
      node.imports.some((imp) => imp.includes("'use client'") || imp.includes('"use client"'))
    );

    // Server-only modules
    const serverOnlyModules = [
      "server-only",
      "database",
      "credentials",
      "@db/",
      "prisma",
    ];

    for (const clientComponent of clientComponents) {
      const serverImports = clientComponent.imports.filter((imp) =>
        serverOnlyModules.some((mod) => imp.includes(mod))
      );

      if (serverImports.length > 0) {
        const problem: ArchitectureProblem = {
          id: "server-code-in-client-component",
          title: `Server code in client component: ${clientComponent.file}`,
          severity: "high",
          category: "boundary",
          description: `This client component (marked with 'use client') is importing server-only modules. This will cause runtime errors in the browser.`,
          whyItMatters:
            "Server code shouldn't be bundled to the browser. This increases bundle size and can expose secrets.",
          evidence: [
            `File marked as 'use client'`,
            `Importing: ${serverImports.join(", ")}`,
          ],
          affectedFiles: [clientComponent.file],
          suggestedFixes: [
            "Extract server logic to a separate server component",
            "Use server actions for data fetching instead",
            "Move database calls to route handlers or server components",
            "Use callbacks/props to pass data from server components",
          ],
        };

        problems.push(problem);
      }
    }

    return problems;
  },
};

/**
 * Heuristic: Route handlers not in app/api
 */
export const routeHandlersOutsideApiHeuristic: ProblemHeuristic = {
  id: "route-handlers-outside-api",
  name: "Route handlers outside app/api directory",
  category: "layering",

  detect(context: ProblemDetectionContext): ArchitectureProblem[] {
    const problems: ArchitectureProblem[] = [];

    // Look for route.ts files outside app/api
    const routeHandlers = context.graph.nodes.filter((node) =>
      node.file.includes("/route.") && !node.file.includes("/app/api/")
    );

    if (routeHandlers.length > 0) {
      const problem: ArchitectureProblem = {
        id: "route-handlers-outside-api",
        title: "Route handlers outside app/api",
        severity: "medium",
        category: "layering",
        description: `Found ${routeHandlers.length} route handler(s) outside app/api directory. Next.js API routes should be organized in app/api.`,
        whyItMatters: "Inconsistent structure makes it hard to find and manage API routes. Makes API discovery harder.",
        evidence: [
          `Found route handlers: ${routeHandlers.map((r) => r.file).join(", ")}`,
          `Next.js convention: API routes in app/api/`,
        ],
        affectedFiles: routeHandlers.map((r) => r.file),
        suggestedFixes: [
          "Move route.ts files to app/api structure",
          "Use app/api/[...route]/route.ts for grouped APIs",
          "Keep API routes organized by feature",
        ],
      };

      problems.push(problem);
    }

    return problems;
  },
};

export const nextAppRouterHeuristics: ProblemHeuristic[] = [
  serverCodeInClientComponentHeuristic,
  routeHandlersOutsideApiHeuristic,
];
