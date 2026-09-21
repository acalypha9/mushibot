"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import type { ReminderVariableItem } from "../../types";

export interface MessageTemplateEditorProps {
  message: string;
  setMessage: (val: string | ((prev: string) => string)) => void;
  variables: ReminderVariableItem[];
}

export function MessageTemplateEditor({
  message,
  setMessage,
  variables,
}: MessageTemplateEditorProps) {
  const insertPlaceholder = (tag: string) => {
    setMessage((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const getVariableTypeLabel = (type?: string) => {
    switch (type) {
      case "date_now":
        return "Date";
      case "time_now":
        return "Time";
      case "datetime_now":
        return "DateTime";
      case "url":
        return "URL";
      default:
        return "";
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "6px",
          flexWrap: "wrap",
          gap: "6px",
        }}
      >
        <div>
          <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#323130" }}>
            Reminder Message Content <span style={{ color: "#a4262c" }}>*</span>
          </label>
          <div style={{ fontSize: "11px", color: "#605e5c", marginTop: "2px" }}>
            Click tags below to insert placeholders. When sent, <code>{"{...}"}</code> will be replaced with your variable values.
          </div>
        </div>

        {/* Clickable Placeholder Pills */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Title tag always available */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertPlaceholder("{title}")}
            title="Click to insert {title}"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>+</span>
            <code>{"{title}"}</code>
            <span style={{ fontWeight: "400", opacity: 0.85, fontSize: "10.5px" }}>Title</span>
          </Button>

          {/* Dynamic tags from defined variables */}
          {variables
            .filter((v) => v.key.trim().length > 0)
            .map((v) => {
              const cleanKey = v.key.trim().replace(/^\{+|\}+$/g, "");
              const tagStr = `{${cleanKey}}`;
              const typeLabel = getVariableTypeLabel(v.type);

              return (
                <Button
                  key={v.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertPlaceholder(tagStr)}
                  title={`Click to insert ${tagStr} (${v.type || "text"})`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>+</span>
                  <code>{tagStr}</code>
                  {typeLabel && (
                    <span style={{ fontWeight: "400", opacity: 0.85, fontSize: "10.5px" }}>
                      {typeLabel}
                    </span>
                  )}
                </Button>
              );
            })}
        </div>
      </div>

      <Textarea
        required
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={"Reminder for {title}\n{description}\nJoin: {link}"}
      />
    </div>
  );
}
