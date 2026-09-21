import { FormEvent } from "react";
import { Collection, DeleteTarget } from "./types";
import { KnowledgeFormState } from "./knowledgeReducers";
import {
  validateCollectionInput,
  buildCreateCollectionRequest,
  buildUpdateCollectionRequest,
  buildDeleteCollectionRequest,
} from "./operationsBuilders";

interface CollectionMutationParams {
  token: string | null;
  collections: Collection[];
  selectedCol: Collection | null;
  formState: KnowledgeFormState;
  availableEmbeddingModels: string[];
  setSelectedCol: (col: Collection | null) => void;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  triggerRefresh: () => void;
  setColName: (name: string) => void;
  setColDesc: (desc: string) => void;
  setColErrorMsg: (msg: string | null) => void;
  setShowCreateColModal: (show: boolean) => void;
  editingCol: Collection | null;
  setEditingCol: (col: Collection | null) => void;
  setDeleteTarget: (target: DeleteTarget | null) => void;
}

export function useCollectionMutations({
  token,
  collections,
  selectedCol,
  formState,
  availableEmbeddingModels,
  setSelectedCol,
  setErrorMsg,
  setSuccessMsg,
  triggerRefresh,
  setColName,
  setColDesc,
  setColErrorMsg,
  setShowCreateColModal,
  editingCol,
  setEditingCol,
  setDeleteTarget,
}: CollectionMutationParams) {
  const { colName, colDesc, colEmbeddingModel, colParserModel } = formState;

  const handleCreateCollection = async (e: FormEvent) => {
    e.preventDefault();
    setColErrorMsg(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    const selectedEmbModel = colEmbeddingModel || availableEmbeddingModels[0] || "";
    const validationError = validateCollectionInput({
      colName,
      collections,
      selectedEmbModel,
      availableEmbeddingModels,
    });
    if (validationError) {
      setColErrorMsg(validationError);
      return;
    }

    try {
      const req = buildCreateCollectionRequest({
        token,
        colName,
        colDesc,
        colEmbeddingModel: selectedEmbModel,
        colParserModel,
      });
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      const data = await res.json();
      if (!res.ok) {
        setColErrorMsg(data.detail || data.error?.message || "Failed to create collection");
        return;
      }
      setSuccessMsg(`Collection '${data.name}' created!`);
      setColName("");
      setColDesc("");
      setColErrorMsg(null);
      setShowCreateColModal(false);
      triggerRefresh();
    } catch (err) {
      setColErrorMsg(err instanceof Error ? err.message : "Failed to create collection");
    }
  };

  const handleUpdateCollection = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCol) return;
    const trimmedColName = colName.trim();
    if (!trimmedColName) return;
    const isDuplicate = collections.some(
      (c) => c.id !== editingCol.id && c.name.trim().toLowerCase() === trimmedColName.toLowerCase()
    );
    if (isDuplicate) {
      setColErrorMsg(`A collection named "${trimmedColName}" already exists. Please enter a unique name.`);
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const req = buildUpdateCollectionRequest({
        token,
        colId: editingCol.id,
        colName,
        colDesc,
      });
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update collection");
      setSuccessMsg("Collection updated successfully!");
      setEditingCol(null);
      setColName("");
      setColDesc("");
      triggerRefresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update collection");
    }
  };

  const handleDeleteCollection = (colId: string, targetColName: string) => {
    setDeleteTarget({
      title: "collection",
      name: targetColName,
      warning: "This will delete the collection, all its documents, and all embedded chunks. This action cannot be undone.",
      onConfirm: async () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
          const req = buildDeleteCollectionRequest({ token, colId });
          const res = await fetch(req.url, {
            method: req.method,
            headers: req.headers,
          });
          if (!res.ok) throw new Error("Failed to delete collection");
          setSuccessMsg(`Collection '${targetColName}' deleted successfully.`);
          if (selectedCol?.id === colId) setSelectedCol(null);
          triggerRefresh();
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Delete collection failed");
        }
      },
    });
  };

  return { handleCreateCollection, handleUpdateCollection, handleDeleteCollection };
}
