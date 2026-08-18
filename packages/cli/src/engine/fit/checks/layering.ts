/**
 * Layering Fit Checks
 * 
 * Validates that expected layers are present and properly structured
 */

import type { FitCheckFunction, FitEvaluationContext } from "../types.js";

/**
 * Check: Expected layers are present
 */
export const layerPresenceCheck: FitCheckFunction = (context) => {
  const { expectedLayers } = context.profile;
  const { layers } = context.structure;

  const missing = expectedLayers.filter((layer) => !layers.includes(layer));
  const present = expectedLayers.filter((layer) => layers.includes(layer));

  if (missing.length === 0) {
    return {
      name: "Layer structure presence",
      status: "ok",
      description: `All expected layers present: ${present.join(", ")}`,
    };
  }

  if (present.length >= expectedLayers.length * 0.7) {
    return {
      name: "Layer structure presence",
      status: "warning",
      description: `Missing ${missing.length} of ${expectedLayers.length} expected layers: ${missing.join(", ")}`,
    };
  }

  return {
    name: "Layer structure presence",
    status: "fail",
    description: `Only ${present.length} of ${expectedLayers.length} expected layers found. Missing: ${missing.join(", ")}`,
  };
};

/**
 * Check: No unexpected layers diluting structure
 */
export const unexpectedLayersCheck: FitCheckFunction = (context) => {
  const { expectedLayers } = context.profile;
  const { layers } = context.structure;

  const unexpected = layers.filter((layer) => !expectedLayers.includes(layer));

  if (unexpected.length === 0) {
    return {
      name: "No unexpected layers",
      status: "ok",
      description: "Project structure matches expected layers",
    };
  }

  if (unexpected.length <= 2) {
    return {
      name: "No unexpected layers",
      status: "warning",
      description: `${unexpected.length} unexpected layers found: ${unexpected.join(", ")}. Consider consolidating.`,
    };
  }

  return {
    name: "No unexpected layers",
    status: "fail",
    description: `Too many unexpected layers (${unexpected.length}): ${unexpected.join(", ")}. Structure is unclear.`,
  };
};

/**
 * Check: Clean layer boundaries (no cross-layer imports)
 */
export const layerBoundariesCheck: FitCheckFunction = (context) => {
  if (!context.structure.detectedLayersPerFile) {
    return {
      name: "Layer boundary separation",
      status: "warning",
      description: "Could not determine layer boundaries for files",
    };
  }

  const crossLayerImports = context.graph.edges.filter((edge) => {
    const fromLayer = context.structure.detectedLayersPerFile[edge.from];
    const toLayer = context.structure.detectedLayersPerFile[edge.to];
    return fromLayer && toLayer && fromLayer !== toLayer;
  }).length;

  const totalImports = context.graph.edges.length;
  const crossLayerRatio = totalImports > 0 ? crossLayerImports / totalImports : 0;

  if (crossLayerRatio < 0.3) {
    return {
      name: "Layer boundary separation",
      status: "ok",
      description: `Clean layer boundaries: ${Math.round(crossLayerRatio * 100)}% cross-layer imports`,
    };
  }

  if (crossLayerRatio < 0.5) {
    return {
      name: "Layer boundary separation",
      status: "warning",
      description: `${Math.round(crossLayerRatio * 100)}% of imports cross layer boundaries. Consider encapsulation.`,
    };
  }

  return {
    name: "Layer boundary separation",
    status: "fail",
    description: `${Math.round(crossLayerRatio * 100)}% cross-layer imports. Boundaries are weak.`,
  };
};

export const layeringChecks: FitCheckFunction[] = [
  layerPresenceCheck,
  unexpectedLayersCheck,
  layerBoundariesCheck,
];
