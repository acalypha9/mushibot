"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import { Sliders } from "lucide-react";
import { ConfiguredModel, ProviderFormData } from "../types";
import { ModelSettingsForm } from "./ModelSettingsForm";

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingModel: ConfiguredModel | null;
  modelsDevMap: Record<string, unknown>;
  formData: ProviderFormData;
  activeTab: "chat" | "embedding" | "parser";
  onSaveModel: (updatedModel: ConfiguredModel) => void;
}

export function ModelSettingsModal({
  isOpen,
  onClose,
  editingModel,
  modelsDevMap,
  formData,
  activeTab,
  onSaveModel
}: ModelSettingsModalProps) {
  if (!isOpen || !editingModel) {
    return null;
  }

  // Composite remount key ensures fresh initial state on reopen, model switch, or formData preset switch
  const remountKey = `${editingModel.id}-${editingModel.is_active ?? true}-${editingModel.temperature ?? ""}-${editingModel.context_length ?? ""}-${formData.device ?? ""}-${formData.normalize_embeddings ?? ""}`;

  return (
    <Modal
      isOpen={isOpen && !!editingModel}
      onClose={onClose}
      title={`Edit ${editingModel.id}`}
      icon={<Sliders style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
      maxWidth="lg"
    >
      <ModelSettingsForm
        key={remountKey}
        editingModel={editingModel}
        modelsDevMap={modelsDevMap}
        formData={formData}
        activeTab={activeTab}
        onClose={onClose}
        onSaveModel={onSaveModel}
      />
    </Modal>
  );
}
