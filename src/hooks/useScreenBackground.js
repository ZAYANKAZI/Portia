// src/hooks/useScreenBackground.js
import { useMemo } from "react";

/**
 * Computes CSS style for screen background.
 * Supports: image | one color | two colors | custom (up to 4)
 */
export function useScreenBackground(bgConfig = {}) {
  return useMemo(() => {
    const { type, colors = [], image, direction = "to right" } = bgConfig;

    switch (type) {
      case "image":
        return {
          backgroundImage: `url(${image || ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };

      case "one":
        return { background: colors[0] || "#ffffff" };

      case "two":
        if (colors.length >= 2) {
          return {
            background: `linear-gradient(${direction}, ${colors[0]}, ${colors[1]})`,
          };
        }
        return { background: colors[0] || "#ffffff" };

      case "custom":
        if (colors.length >= 2) {
          const stops = colors
            .map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`)
            .join(", ");
          return {
            background: `linear-gradient(${direction}, ${stops})`,
          };
        }
        return { background: colors[0] || "#ffffff" };

      default:
        return { background: "#ffffff" };
    }
  }, [bgConfig]);
}
