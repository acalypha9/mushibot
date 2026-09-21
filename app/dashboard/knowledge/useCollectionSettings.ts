import { FormEvent } from "react";
import { Collection, KBSettings, getActiveCollectionIds } from "./types";
import { KnowledgeFormState } from "./knowledgeReducers";
import {
  buildSaveSettingsRequest,
  buildSetActiveCollectionRequest,
} from "./operationsBuilders";

interface CollectionSettingsParams {
  token: string | null;
  selectedCol: Collection | null;
  settings: KBSettings;
  formState: KnowledgeFormState;
  setSettings: (updater: KBSettings | ((prev: KBSettings) => KBSettings)) => void;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  triggerRefresh: () => void;
  setUploadChunkSize: (size: number) => void;
  setUploadChunkOverlap: (overlap: number) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  setIsSaved: (val: boolean) => void;
}

export function useCollectionSettings({
  token,
  selectedCol,
  settings,
  formState,
  setSettings,
  setErrorMsg,
  setSuccessMsg,
  triggerRefresh,
  setUploadChunkSize,
  setUploadChunkOverlap,
  setHasUnsavedChanges,
  setIsSaved,
}: CollectionSettingsParams) {
  const { llamaKeyInput, chunkSizeInput, chunkOverlapInput, embeddingModelInput, retrievalKInput } = formState;

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const targetColId = selectedCol ? selectedCol.id : undefined;
      const req = buildSaveSettingsRequest({
        token,
        targetColId,
        llamaKeyInput,
        chunkSizeInput,
        chunkOverlapInput,
        embeddingModelInput,
        retrievalKInput,
        activeCollectionId: selectedCol ? selectedCol.id : settings.active_collection_id,
      });
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save settings");
      setSettings(data);
      setUploadChunkSize(Number(chunkSizeInput));
      setUploadChunkOverlap(Number(chunkOverlapInput));
      setHasUnsavedChanges(false);
      setIsSaved(true);
      setSuccessMsg("Knowledge Base Settings updated!");
      triggerRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save settings");
    }
  };

  const handleSetActiveCollection = async (colId: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    if (!token) return;

    const currentActive = getActiveCollectionIds(settings);
    const newActive = currentActive.includes(colId)
      ? currentActive.filter((id) => id !== colId)
      : [...currentActive, colId];

    setSettings((prev) => ({
      ...prev,
      active_collection_ids: newActive,
      active_collection_id: newActive.join(","),
    }));

    try {
      const req = buildSetActiveCollectionRequest({ token, newActive });
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to activate collection");
      setSettings((prev) => ({
        ...prev,
        ...data,
        active_collection_ids: newActive,
        active_collection_id: newActive.join(","),
      }));
    } catch (err) {
      setSettings((prev) => ({
        ...prev,
        active_collection_ids: currentActive,
        active_collection_id: currentActive.join(","),
      }));
      setErrorMsg(err instanceof Error ? err.message : "Failed to set active collection");
    }
  };

  return { handleSaveSettings, handleSetActiveCollection };
}
