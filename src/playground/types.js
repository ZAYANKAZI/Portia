// ======================================================================
// File: src/playground/types.js
// ======================================================================
/**
 * Minimal event schema for uniform logs (stable keys only).
 */
export const EVENT = {
  APP_START: "app.start",
  PROJECT_LOAD: "project.load",
  MIGRATE_RUN: "migrate.run",
  FONT_STATUS: "font.status",
  BG_CHANGE: "bg.change",
  CARD_ADD: "card.add",
  CARD_REMOVE: "card.remove",
  CARD_MOVE: "card.move",
  CARD_RESIZE: "card.resize",
  INLINE_OPEN: "inline.open",
  INLINE_COMMIT: "inline.commit",
  INLINE_CANCEL: "inline.cancel",
  PANEL_CHANGE: "panel.change",
  EXPORT_START: "export.start",
  EXPORT_SUCCESS: "export.success",
  EXPORT_FAIL: "export.fail",
  ERROR: "error",
  METRIC_TICK: "metrics.tick",
};