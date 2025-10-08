// src/components/common/EditableText.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Inline, double-click-to-edit text.
 *
 * Props:
 * - value: string (required) – current text value
 * - onChange: (next: string) => void (required) – commit handler
 * - className: string – classes applied to the display span (and editor)
 * - style: object – inline styles for display span (copied to editor)
 * - multiline: boolean – allow line breaks (default false)
 * - placeholder: string – shown when empty and not editing
 * - selectOnEdit: boolean – select all on enter edit (default true)
 * - maxLength: number – optional hard cap
 */
export default function EditableText({
  value = "",
  onChange,
  className = "",
  style = {},
  multiline = false,
  placeholder = "",
  selectOnEdit = true,
  maxLength
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const spanRef = useRef(null);
  const editorRef = useRef(null);

  // Keep draft synced if external value changes while not editing
  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  useEffect(() => {
    if (editing && editorRef.current) {
      // Focus and optionally select
      const el = editorRef.current;
      el.focus();
      if (selectOnEdit) {
        if ("select" in el) el.select?.();
        else {
          const range = document.createRange();
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }, [editing]);

  const startEditing = (e) => {
    // Only left-button double click
    if (e.button !== 0) return;
    e.stopPropagation();
    setDraft(value ?? "");
    setEditing(true);
  };

  const commit = () => {
    const clean = sanitize(draft, maxLength);
    if (clean !== value) onChange?.(clean);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  const onKeyDown = (e) => {
    // Enter commits (unless multiline + Shift needed for newline)
    if (e.key === "Enter" && (!multiline || !e.shiftKey)) {
      e.preventDefault();
      commit();
    }
    // Esc cancels
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const onPastePlain = (e) => {
    // Force plain text paste
    if (!multiline) return; // input already plain
    const text = e.clipboardData.getData("text/plain");
    e.preventDefault();
    insertAtCursor(text);
  };

  const insertAtCursor = (text) => {
    // For contenteditable
    const sel = window.getSelection();
    if (!sel.rangeCount) {
      setDraft((d) => (d ?? "") + text);
      return;
    }
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    // Update draft to editor content
    setTimeout(() => {
      setDraft(editorRef.current?.innerText ?? "");
    }, 0);
  };

  const onInputCE = () => {
    // Sync draft from contenteditable
    setDraft(editorRef.current?.innerText ?? "");
  };

  const displayText = (value ?? "").trim() === "" ? (placeholder || "Double-click to edit") : value;

  // Render
  if (!editing) {
    return (
      <span
        ref={spanRef}
        className={className}
        style={{ cursor: "text", userSelect: "none", ...style }}
        onDoubleClick={startEditing}
        // Prevent canvas drag when trying to edit
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {displayText}
      </span>
    );
  }

  // Editor: use <input> for single line, contenteditable <div> for multiline
  return multiline ? (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      className={className}
      style={{
        outline: "2px solid rgba(59,130,246,.7)", // Tailwind-ish ring
        borderRadius: 6,
        whiteSpace: "pre-wrap",
        ...style
      }}
      onInput={onInputCE}
      onBlur={commit}
      onKeyDown={onKeyDown}
      onPaste={onPastePlain}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {draft}
    </div>
  ) : (
    <input
      ref={editorRef}
      type="text"
      className={className}
      style={{
        outline: "2px solid rgba(59,130,246,.7)",
        borderRadius: 6,
        ...style
      }}
      value={draft}
      onChange={(e) => {
        const next = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
        setDraft(next);
      }}
      onBlur={commit}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      autoComplete="off"
      spellCheck={false}
    />
  );
}

function sanitize(text, maxLength) {
  let t = (text ?? "").replace(/\r\n/g, "\n");
  if (maxLength) t = t.slice(0, maxLength);
  // strip weird control chars except tabs/newlines
  t = t.replace(/[^\S\n\t]+$/gm, ""); // trim trailing spaces per line
  return t;
}
