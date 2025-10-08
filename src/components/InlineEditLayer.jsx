// File: src/components/InlineEditLayer.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FlowLogger from "../utils/FlowLogger";

export default function InlineEditLayer({
  captureId = "preview-capture",
  screen,
  onCommit,
  enabled = true,
}) {
  const [st, setSt] = useState(null); // { rect, text, el, sid, path, textColor, prevPaint, prevShadow }
  const taRef = useRef(null);

  // --- utils ---
  const holderSel =
    "[data-sec-id], [data-section-id], [data-section], [data-id], [data-sid], [data-sec]";
  const getHolder = (el) => el?.closest?.(holderSel) || null;
  const getSectionId = (holder) => {
    const d = holder?.dataset || {};
    return d.secId || d.sectionId || d.section || d.sid || d.id || d.sec || null;
  };
  const elsUnder = (x, y) => document.elementsFromPoint?.(x, y) || [];

  // Tight rect using a DOM Range over the deepest text node
  const tightRectForText = (node) => {
    try {
      if (!node) return null;
      let target = node;
      if (target.nodeType === 1) {
        const walker = document.createTreeWalker(
          target,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (n) =>
              n.nodeValue && n.nodeValue.replace(/\s+/g, "").length
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT,
          }
        );
        if (walker.nextNode()) target = walker.currentNode;
      }
      if (target.nodeType === 3) {
        const r = document.createRange();
        r.selectNodeContents(target);
        const rect = r.getBoundingClientRect();
        if (rect && rect.width && rect.height) return rect;
      }
      return node.getBoundingClientRect();
    } catch {
      return node.getBoundingClientRect();
    }
  };

  // open editor on dblclick
  useEffect(() => {
    if (!enabled) return;
    const root = document.getElementById(captureId);
    if (!root) return;

    const onDbl = (e) => {
      const holder = getHolder(e.target);
      const sid = getSectionId(holder);
      if (!sid) return;

      // Prefer the deepest element at pointer that has data-path
      const under = elsUnder(e.clientX, e.clientY);
      let target =
        under.find((el) => el.hasAttribute?.("data-path")) || under[0];
      if (!target) return;

      const path = target.getAttribute?.("data-path") || null;
      const text = (target.innerText || target.textContent || "").trim();
      if (!text || !path) return;

      const rect = tightRectForText(target);
      if (!rect || rect.width < 1 || rect.height < 1) return;

      // Capture original paint BEFORE hiding
      const cs = getComputedStyle(target);
      const textColor = cs.color;
      const prevPaint = target.style.color;
      const prevShadow = target.style.textShadow;

      // Hide only text paint so banners/shapes remain (why: avoid double-paint)
      target.style.color = "transparent";
      target.style.textShadow = "none";

      FlowLogger.group("inline.open", {
        sectionId: sid,
        path,
        text,
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
      });

      setSt({
        rect,
        text,
        el: target,
        sid,
        path,
        textColor,
        prevPaint,
        prevShadow,
      });

      e.preventDefault();
      e.stopPropagation();
    };

    root.addEventListener("dblclick", onDbl, true);
    return () => root.removeEventListener("dblclick", onDbl, true);
  }, [captureId, screen, enabled]);

  // Focus textarea after mount
  useEffect(() => {
    if (!st) return;
    const ta = taRef.current;
    if (!ta) return;
    ta.value = st.text;
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }, [st]);

  // Restore paint on unmount/close
  useEffect(
    () => () => {
      if (st?.el) {
        st.el.style.color = st.prevPaint ?? "";
        st.el.style.textShadow = st.prevShadow ?? "";
      }
    },
    [st]
  );

  // Commit helper: prefer object shape; fallback to positional
  const commitValue = (sid, path, value) => {
    if (!onCommit) return;
    try {
      if (typeof onCommit === "function") {
        if (onCommit.length >= 3) {
          // legacy signature onCommit(sid, path, value)
          onCommit(sid, path, value);
        } else {
          // preferred signature onCommit({ sectionId, path, value })
          onCommit({ sectionId: sid, path, value });
        }
      }
    } catch {
      // last resort
      try {
        onCommit({ sectionId: sid, path, value });
      } catch {
        onCommit(sid, path, value);
      }
    }
  };

  const close = (apply) => {
    if (!st) return setSt(null);
    const { el, text, sid, path, prevPaint, prevShadow } = st;
    const ta = taRef.current;
    const val = (ta?.value ?? "").replace(/\u00a0/g, " ").trim();
    const newText = apply ? (val || text) : text;

    FlowLogger.group("inline.close", {
      sectionId: sid,
      path,
      oldText: text,
      usedText: newText,
      apply,
    });

    if (apply && newText !== text) {
      // app update
      commitValue(sid, path, newText);
      // immediate visual feedback
      if (el && el.isConnected) el.textContent = newText;
    }

    if (el) {
      el.style.color = prevPaint ?? "";
      el.style.textShadow = prevShadow ?? "";
    }
    setSt(null);
  };

  if (!enabled || !st) return null;
  const { rect, textColor } = st;

  // Mirror font styles (minimal set)
  const fontStyle = (() => {
    const cs = st?.el ? getComputedStyle(st.el) : null;
    if (!cs) return {};
    return {
      font: cs.font,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
      textAlign: cs.textAlign,
      lineHeight: cs.lineHeight,
    };
  })();

  const overlay = (
    <div
      data-no-export="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        pointerEvents: "none",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close(true);
      }}
    >
      <textarea
        ref={taRef}
        defaultValue={st.text}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            close(true);
          } else if (e.key === "Escape") {
            e.preventDefault();
            close(false);
          }
        }}
        onBlur={() => close(true)}
        data-gramm="false"
        data-gramm_editor="false"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          position: "fixed",
          left: rect.left + "px",
          top: rect.top + "px",
          width: Math.max(12, rect.width) + "px",
          height: rect.height + "px",
          // Blue boundary (visible)
          outline: "2px solid #3b82f6",
          borderRadius: "4px",
          background: "rgba(255,255,255,0.02)",
          padding: 0,
          margin: 0,
          resize: "none",
          overflow: "hidden",
          whiteSpace: "pre",
          pointerEvents: "auto",
          caretColor: textColor || "#111",
          color: textColor || "#111", // keep original color visible
          ...fontStyle,
        }}
      />
    </div>
  );

  // Portal avoids transformed ancestors interfering with fixed positioning (why: zoomed canvas)
  return createPortal(overlay, document.body);
}
