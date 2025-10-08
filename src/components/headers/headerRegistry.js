import Solid from "./banners/Solid";
import Gradient from "./banners/Gradient";
import TwinFlagThreaded from "./banners/TwinFlagThreaded";
import FlagTip from "./banners/FlagTip";
import ImageBrush from "./banners/ImageBrush";

/**
 * Behavior tells the renderer whether a header is stacked inside the plate
 * ("embedded") or floats above it ("free").
 */
export const HEADER_BEHAVIOR = {
  solid: "embedded",
  gradient: "embedded",
  "double-flag": "free",
  "flag-tip": "free",
  "image-brush": "free",
};

/**
 * Each entry exports: { Render, Panel, defaults }
 */
export const HEADER_REGISTRY = {
  solid: Solid,
  gradient: Gradient,
  "double-flag": TwinFlagThreaded,
  "flag-tip": FlagTip,
  "image-brush": ImageBrush,
};

/**
 * Canonical defaults used when a header is created or its style is switched.
 * - Free styles spawn narrower and ABOVE the plate (offsetY = -height).
 * - Attached styles (solid/gradient) fill width and sit at top of the plate.
 * - Free styles get an independent `props.radius` (corner radius for the banner).
 */
export function headerDefaults(style = "solid") {
  const isFree = HEADER_BEHAVIOR[style] === "free";
  const HEIGHT = 120;

  // Ask the module for its style-specific props
  const mod = HEADER_REGISTRY[style] || HEADER_REGISTRY.solid;
  const styleProps = (mod?.defaults?.() || {});

  // Ensure free styles have their own header radius control
  if (isFree && styleProps.radius == null) {
    styleProps.radius = 12;
  }

  return {
    type: style,
    align: "center",
    height: HEIGHT,

    // Canonical geometry read by panels + renderer
    widthPct: isFree ? 90 : 100,
    offsetX: 0,
    offsetY: isFree ? -HEIGHT : 0,

    // Style-specific props (color, gradients, notch geometry, etc.)
    props: styleProps,
  };
}
