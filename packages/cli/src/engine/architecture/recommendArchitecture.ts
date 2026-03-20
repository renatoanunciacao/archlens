import type { ProjectFingerprint } from "../detection/detectProject.js";

export type ArchitectureRecommendation = {
  profile:
    | "next-app-router-feature-based"
    | "vite-feature-spa"
    | "backend-modular-monolith"
    | "backend-clean-architecture";
  recommendedLayers: string[];
  description: string;
};

export function recommendArchitecture(
  fingerprint: ProjectFingerprint,
): ArchitectureRecommendation {
  if (fingerprint.framework === "next" && fingerprint.router === "app-router") {
    return {
      profile: "next-app-router-feature-based",
      recommendedLayers: ["app", "features", "shared", "server"],
      description:
        "Next.js app router projects are best organized around feature boundaries and shared utilities.",
    };
  }

  if (fingerprint.framework === "vite") {
    return {
      profile: "vite-feature-spa",
      recommendedLayers: ["pages", "features", "entities", "shared", "services"],
      description:
        "Vite SPAs benefit from a feature-based structure with shared libraries and services.",
    };
  }

  return {
    profile: "backend-modular-monolith",
    recommendedLayers: ["modules", "application", "domain", "infra"],
    description:
      "Backend projects are recommended to follow a modular monolith structure, separating domain, application, and infrastructure layers.",
  };
}
