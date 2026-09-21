"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Plus, Trash2 } from "lucide-react";
import type { ReminderVariableItem, ReminderVariableType } from "../../types";
import {
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  DATETIME_FORMAT_OPTIONS,
} from "../../utils";

export interface VariablesDictionaryEditorProps {
  variables: ReminderVariableItem[];
  setVariables: React.Dispatch<React.SetStateAction<ReminderVariableItem[]>>;
}

export function VariablesDictionaryEditor({
  variables,
  setVariables,
}: VariablesDictionaryEditorProps) {
  const handleAddVariable = () => {
    setVariables((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        key: "",
        type: "text",
        value: "",
      },
    ]);
  };

  const handleKeyChange = (index: number, val: string) => {
    setVariables((prev) =>
      prev.map((item, i) => (i === index ? { ...item, key: val } : item))
    );
  };

  const handleTypeChange = (index: number, nextType: ReminderVariableType, currentItem: ReminderVariableItem) => {
    const isCurrentDateTime =
      currentItem.type === "date_now" ||
      currentItem.type === "time_now" ||
      currentItem.type === "datetime_now";

    let defaultValue = currentItem.value;
    if (nextType === "date_now") {
      defaultValue = currentItem.type === "date_now" ? currentItem.value : "DD/MM/YYYY";
    } else if (nextType === "time_now") {
      defaultValue = currentItem.type === "time_now" ? currentItem.value : "HH:mm";
    } else if (nextType === "datetime_now") {
      defaultValue = currentItem.type === "datetime_now" ? currentItem.value : "DD/MM/YYYY HH:mm";
    } else if (isCurrentDateTime) {
      defaultValue = "";
    }

    setVariables((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, type: nextType, value: defaultValue } : item
      )
    );
  };

  const handleValueChange = (index: number, val: string) => {
    setVariables((prev) =>
      prev.map((item, i) => (i === index ? { ...item, value: val } : item))
    );
  };

  const handleRemoveVariable = (index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "8px",
        background: "#faf9f8",
        border: "1px solid #edebe9",
        display: "flex",
        flexDirection: "column",
        gap: variables.length > 0 ? "10px" : "0px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#323130" }}>Variables</div>
          <div style={{ fontSize: "11px", color: "#605e5c", marginTop: "1px" }}>
            Custom variables for message placeholders.
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleAddVariable}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Plus style={{ width: "12px", height: "12px" }} />
          <span>Add Variable</span>
        </Button>
      </div>

      {variables.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
          {variables.map((v, index) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* 1. Key Input */}
              <div style={{ flex: "1 1 28%", minWidth: "100px" }}>
                <Input
                  type="text"
                  required
                  value={v.key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  placeholder="key"
                />
              </div>

              <span style={{ fontWeight: "700", color: "#605e5c", fontSize: "13px" }}>:</span>

              {/* 2. Data Type Select */}
              <div style={{ flex: "1 1 32%", minWidth: "120px" }}>
                <Select
                  value={v.type || "text"}
                  onChange={(e) => handleTypeChange(index, e.target.value as ReminderVariableType, v)}
                >
                  <option value="text">Text</option>
                  <option value="date_now">Date (Now)</option>
                  <option value="time_now">Time (Now)</option>
                  <option value="datetime_now">Date & Time (Now)</option>
                  <option value="number">Number</option>
                  <option value="url">URL</option>
                </Select>
              </div>

              <span style={{ fontWeight: "700", color: "#605e5c", fontSize: "13px" }}>:</span>

              {/* 3. Value Input / Format Picker */}
              <div style={{ flex: "1 1 40%", minWidth: "130px" }}>
                {v.type === "date_now" ? (
                  <Select
                    value={v.value || "DD/MM/YYYY"}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                  >
                    {DATE_FORMAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                ) : v.type === "time_now" ? (
                  <Select
                    value={v.value || "HH:mm"}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                  >
                    {TIME_FORMAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                ) : v.type === "datetime_now" ? (
                  <Select
                    value={v.value || "DD/MM/YYYY HH:mm"}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                  >
                    {DATETIME_FORMAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                ) : v.type === "number" ? (
                  <Input
                    type="number"
                    required
                    value={v.value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    placeholder="value"
                  />
                ) : v.type === "url" ? (
                  <Input
                    type="url"
                    required
                    value={v.value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    placeholder="https://..."
                  />
                ) : (
                  <Input
                    type="text"
                    required
                    value={v.value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    placeholder="value"
                  />
                )}
              </div>

              {/* Delete Row Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveVariable(index)}
                title="Remove variable"
                style={{
                  color: "#a4262c",
                  padding: "4px",
                }}
              >
                <Trash2 style={{ width: "14px", height: "14px" }} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
