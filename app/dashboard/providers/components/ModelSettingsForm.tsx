"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfiguredModel, ProviderFormData } from "../types";
import { ParserSettingsSection } from "./ParserSettingsSection";
import { EmbeddingSettingsSection } from "./EmbeddingSettingsSection";
import { ChatModelSettingsSection } from "./ChatModelSettingsSection";
import {
  initializeSettingsState,
  checkReasoningSupported,
  buildUpdatedModel
} from "./modelSettingsHelpers";

interface ModelSettingsFormProps {
  editingModel: ConfiguredModel;
  modelsDevMap: Record<string, unknown>;
  formData: ProviderFormData;
  activeTab: "chat" | "embedding" | "parser";
  onClose: () => void;
  onSaveModel: (updatedModel: ConfiguredModel) => void;
}

export function ModelSettingsForm({
  editingModel,
  modelsDevMap,
  formData,
  activeTab,
  onClose,
  onSaveModel
}: ModelSettingsFormProps) {
  const [state, setState] = useState(() =>
    initializeSettingsState(editingModel, modelsDevMap, formData)
  );

  const handleSave = () => {
    const updatedModel = buildUpdatedModel(editingModel, state);
    onSaveModel(updatedModel);
  };

  const isReasoningSupported = checkReasoningSupported(editingModel, state.modelReasoning);

  const isParserMode =
    activeTab === "parser" ||
    formData.provider_type === "llamaindex" ||
    formData.provider_type === "llama_cloud";

  const isEmbeddingMode =
    activeTab === "embedding" ||
    ((formData as unknown as Record<string, unknown>).category === "embedding");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "12px"
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>Enable</span>
        <label
          style={{
            position: "relative",
            display: "inline-block",
            width: "44px",
            height: "24px",
            cursor: "pointer"
          }}
        >
          <Input
            type="checkbox"
            checked={state.modelEnable}
            onChange={(e) =>
              setState((prev) => ({ ...prev, modelEnable: e.target.checked }))
            }
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: state.modelEnable ? "#742774" : "#cbd5e1",
              transition: ".2s",
              borderRadius: "24px"
            }}
          >
            <span
              style={{
                position: "absolute",
                content: '""',
                height: "18px",
                width: "18px",
                left: state.modelEnable ? "22px" : "3px",
                bottom: "3px",
                backgroundColor: "white",
                transition: ".2s",
                borderRadius: "50%"
              }}
            />
          </span>
        </label>
      </div>

      {isParserMode ? (
        <ParserSettingsSection
          parserTier={state.parserTier}
          setParserTier={(val) => setState((prev) => ({ ...prev, parserTier: val }))}
          parserVersion={state.parserVersion}
          setParserVersion={(val) => setState((prev) => ({ ...prev, parserVersion: val }))}
          parserOutputTables={state.parserOutputTables}
          setParserOutputTables={(val) =>
            setState((prev) => ({ ...prev, parserOutputTables: val }))
          }
          parserCompactTables={state.parserCompactTables}
          setParserCompactTables={(val) =>
            setState((prev) => ({ ...prev, parserCompactTables: val }))
          }
          parserDisableCache={state.parserDisableCache}
          setParserDisableCache={(val) =>
            setState((prev) => ({ ...prev, parserDisableCache: val }))
          }
          parserPageRanges={state.parserPageRanges}
          setParserPageRanges={(val) =>
            setState((prev) => ({ ...prev, parserPageRanges: val }))
          }
        />
      ) : isEmbeddingMode ? (
        <EmbeddingSettingsSection
          modelExecutionDevice={state.modelExecutionDevice}
          setModelExecutionDevice={(val) =>
            setState((prev) => ({ ...prev, modelExecutionDevice: val }))
          }
          modelNormalizeEmbeddings={state.modelNormalizeEmbeddings}
          setModelNormalizeEmbeddings={(val) =>
            setState((prev) => ({ ...prev, modelNormalizeEmbeddings: val }))
          }
        />
      ) : (
        <ChatModelSettingsSection
          modelHasText={state.modelHasText}
          setModelHasText={(val) => setState((prev) => ({ ...prev, modelHasText: val }))}
          modelHasVision={state.modelHasVision}
          setModelHasVision={(val) => setState((prev) => ({ ...prev, modelHasVision: val }))}
          modelHasAudio={state.modelHasAudio}
          setModelHasAudio={(val) => setState((prev) => ({ ...prev, modelHasAudio: val }))}
          modelHasTools={state.modelHasTools}
          setModelHasTools={(val) => setState((prev) => ({ ...prev, modelHasTools: val }))}
          modelContextWindow={state.modelContextWindow}
          setModelContextWindow={(val) =>
            setState((prev) => ({ ...prev, modelContextWindow: val }))
          }
          modelReasoning={state.modelReasoning}
          setModelReasoning={(val) => setState((prev) => ({ ...prev, modelReasoning: val }))}
          modelReasoningEffort={state.modelReasoningEffort}
          setModelReasoningEffort={(val) =>
            setState((prev) => ({ ...prev, modelReasoningEffort: val }))
          }
          modelTemperature={state.modelTemperature}
          setModelTemperature={(val) =>
            setState((prev) => ({ ...prev, modelTemperature: val }))
          }
          isReasoningSupported={isReasoningSupported}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "10px",
          marginTop: "12px",
          paddingTop: "14px",
          borderTop: "1px solid #f1f5f9"
        }}
      >
        <Button type="button" variant="ghost" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="primary" size="md" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
