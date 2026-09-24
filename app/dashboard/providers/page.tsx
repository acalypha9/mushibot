"use client";

import React, { useEffect, useState, useRef } from "react";
import Button from "@/components/ui/Button";
import { MessageSquare, Binary, FileText, AlertCircle } from "lucide-react";
import { useAuth } from "../../auth";
import { ProviderSidebar } from "./components/ProviderSidebar";
import { ProviderSettingsPanel } from "./components/ProviderSettingsPanel";
import { ModelSettingsModal } from "./components/ModelSettingsModal";
import { CustomModelModal } from "./components/CustomModelModal";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { DeleteProviderModal } from "./components/DeleteProviderModal";
import {
  ConfiguredModel,
  ModelProvider,
  ProviderPreset,
  ProviderFormData,
  PROVIDER_PRESETS,
  TestResult,
  AvailableModelItem,
  DownloadProgressInfo
} from "./types";
import { cleanRawModelId } from "./metadata";

export default function ProvidersPage() {
  const { token } = useAuth();
  const [modelsDevMap, setModelsDevMap] = useState<Record<string, any>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, DownloadProgressInfo>>({});

  useEffect(() => {
    fetch("/api/models-dev")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          const map: Record<string, any> = {};
          for (const [providerKey, providerObj] of Object.entries(data as Record<string, any>)) {
            if (providerObj && providerObj.models && typeof providerObj.models === "object") {
              for (const [modelKey, modelObj] of Object.entries(providerObj.models as Record<string, any>)) {
                if (!modelObj) continue;
                const entry = {
                  ...modelObj,
                  providerName: providerObj.name,
                  providerId: providerObj.id
                };
                map[modelKey.toLowerCase()] = entry;
                map[`${providerKey}/${modelKey}`.toLowerCase()] = entry;
                if (modelObj.id) {
                  map[modelObj.id.toLowerCase()] = entry;
                  map[`${providerKey}/${modelObj.id}`.toLowerCase()] = entry;
                }
                if (modelObj.name) {
                  map[modelObj.name.toLowerCase()] = entry;
                }
              }
            }
          }
          setModelsDevMap(map);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch models.dev api.json:", err);
      });
  }, []);

  const [activeTab, setActiveTab] = useState<"chat" | "embedding" | "parser">("chat");
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [presetSearch, setPresetSearch] = useState("");
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProviderFormData>({
    provider_id: "",
    id: "",
    name: "",
    provider_type: "openai",
    base_url: "",
    api_key: "",
    model_name: "",
    is_active: true,
    is_default: false,
    timeout: 120,
    proxy: "",
    custom_headers: {},
    configured_models: [],
    device: "auto",
    normalize_embeddings: true
  });

  const [saving, setSaving] = useState(false);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [modelTestResults, setModelTestResults] = useState<Record<string, TestResult>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showCustomModelModal, setShowCustomModelModal] = useState(false);
  const [showModelSettingsModal, setShowModelSettingsModal] = useState(false);
  const [editingModel, setEditingModel] = useState<ConfiguredModel | null>(null);

  // Models State
  const [fetchingModels, setFetchingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<AvailableModelItem[]>([]);
  const [availableModelsByCategory, setAvailableModelsByCategory] = useState<Record<string, AvailableModelItem[]>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "chat" || tabParam === "embedding" || tabParam === "parser") {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const updateFormData = (
    updater: Partial<ProviderFormData> | ((prev: ProviderFormData) => ProviderFormData)
  ) => {
    if (typeof updater === "function") {
      setFormData(updater);
    } else {
      setFormData((prev) => ({ ...prev, ...updater }));
    }
  };

  const fetchProviders = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/providers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to load model providers");
      }
      const data: ModelProvider[] = await res.json();
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [token]);

  const categoryProviders = providers.filter((p) => p.category === activeTab);
  const selectedProvider = categoryProviders.find((p) => p.id === selectedProviderId) || null;

  useEffect(() => {
    setShowAddMenu(false);
    setPresetSearch("");
    if (categoryProviders.length > 0) {
      const currentSelectedExists = categoryProviders.some((p) => p.id === selectedProviderId);
      if (!currentSelectedExists) {
        const defaultOne = categoryProviders.find((p) => p.is_default) || categoryProviders[0];
        setSelectedProviderId(defaultOne.id);
      }
    } else {
      setSelectedProviderId(null);
    }
    setModelTestResults({});
    setAvailableModels(availableModelsByCategory[activeTab] || []);
  }, [activeTab, providers, availableModelsByCategory]);

  const initialFormDataRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedProvider) {
      const config = selectedProvider.config || {};
      const baseList: ConfiguredModel[] = config.configured_models || [];
      const defaultModelsList: ConfiguredModel[] = baseList.map((m: ConfiguredModel) => ({
        ...m,
        id: cleanRawModelId(m.id),
        name: cleanRawModelId(m.name || m.id)
      }));

      const initialObj: ProviderFormData = {
        provider_id: selectedProvider.id,
        id: selectedProvider.name,
        name: selectedProvider.name,
        provider_type: selectedProvider.provider_type,
        base_url: selectedProvider.base_url || "",
        api_key: selectedProvider.api_key || "",
        model_name: selectedProvider.model_name || "",
        is_active: selectedProvider.is_active,
        is_default: selectedProvider.is_default,
        timeout: config.timeout ?? 120,
        proxy: config.proxy || "",
        custom_headers: config.custom_headers || {},
        configured_models: defaultModelsList,
        device: config.model_kwargs?.device || config.device || "auto",
        normalize_embeddings:
          config.encode_kwargs?.normalize_embeddings ?? config.normalize_embeddings ?? true
      };

      setFormData(initialObj);
      initialFormDataRef.current = JSON.stringify(initialObj);
    } else {
      const emptyObj: ProviderFormData = {
        provider_id: "",
        id: "",
        name: "",
        provider_type: "openai",
        base_url: "",
        api_key: "",
        model_name: "",
        is_active: true,
        is_default: false,
        timeout: 120,
        proxy: "",
        custom_headers: {},
        configured_models: [],
        device: "auto",
        normalize_embeddings: true
      };
      setFormData(emptyObj);
      initialFormDataRef.current = JSON.stringify(emptyObj);
    }
    setModelTestResults({});
    setHasUnsavedChanges(false);
    setIsSaved(false);
    setAvailableModels([]);
  }, [selectedProviderId]);

  useEffect(() => {
    if (!selectedProvider || !initialFormDataRef.current) {
      setHasUnsavedChanges(false);
      return;
    }
    if (formData.provider_id !== selectedProvider.id) {
      setHasUnsavedChanges(false);
      return;
    }
    const currentStr = JSON.stringify(formData);
    const dirty = currentStr !== initialFormDataRef.current;
    setHasUnsavedChanges(dirty);
    if (dirty) {
      setIsSaved(false);
    }
  }, [formData, selectedProvider]);

  const handleAddPreset = async (preset: ProviderPreset) => {
    setShowAddMenu(false);
    setPresetSearch("");
    if (!token) return;

    const existingNames = new Set(providers.map((p) => p.name.toLowerCase()));
    let providerName = preset.type;
    if (existingNames.has(providerName.toLowerCase())) {
      let counter = 2;
      while (existingNames.has(`${preset.type}-${counter}`.toLowerCase())) {
        counter++;
      }
      providerName = `${preset.type}-${counter}`;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: activeTab,
          provider_type: preset.type,
          name: providerName,
          base_url: preset.defaultBaseUrl,
          api_key: "",
          model_name: "",
          is_active: true,
          is_default: categoryProviders.length === 0,
          config: {
            timeout: 120,
            proxy: "",
            custom_headers: {},
            configured_models: []
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create provider");
      }

      const created: ModelProvider = await res.json();
      await fetchProviders();
      setSelectedProviderId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add provider");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProviderId || !token) return;

    const targetName = (formData.name || formData.id || "").trim();
    if (!targetName) {
      setError("Provider source ID cannot be empty.");
      return;
    }

    const isDuplicate = providers.some(
      (p) => p.id !== selectedProviderId && p.name.toLowerCase() === targetName.toLowerCase()
    );
    if (isDuplicate) {
      setError(`Provider source ID "${targetName}" is already in use by another provider.`);
      return;
    }

    setSaving(true);
    setError(null);

    const remainingModels = formData.configured_models || [];
    const activeModel =
      remainingModels.length > 0
        ? remainingModels.find((m) => m.is_active)?.name || remainingModels[0]?.name || ""
        : "";

    const updatedConfig = {
      ...(selectedProvider?.config || {}),
      timeout: formData.timeout,
      proxy: formData.proxy,
      custom_headers: formData.custom_headers,
      configured_models: remainingModels,
      model_kwargs: {
        ...(selectedProvider?.config?.model_kwargs || {}),
        device: formData.device || "auto"
      },
      encode_kwargs: {
        ...(selectedProvider?.config?.encode_kwargs || {}),
        normalize_embeddings: formData.normalize_embeddings ?? true
      }
    };

    try {
      const res = await fetch(`/api/providers/${selectedProviderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name || formData.id,
          provider_type: formData.provider_type,
          base_url: formData.base_url,
          api_key: formData.api_key,
          model_name: activeModel,
          is_active: formData.is_active,
          is_default: formData.is_default,
          config: updatedConfig
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update provider configuration");
      }

      const updated: ModelProvider = await res.json();
      await fetchProviders();

      const config = updated.config || {};
      const baseList: ConfiguredModel[] = config.configured_models || [];
      const defaultModelsList: ConfiguredModel[] = baseList.map((m: ConfiguredModel) => ({
        ...m,
        id: cleanRawModelId(m.id),
        name: cleanRawModelId(m.name || m.id)
      }));

      const savedObj: ProviderFormData = {
        provider_id: updated.id,
        id: updated.name,
        name: updated.name,
        provider_type: updated.provider_type,
        base_url: updated.base_url || "",
        api_key: formData.api_key,
        model_name: updated.model_name || "",
        is_active: updated.is_active,
        is_default: updated.is_default,
        timeout: config.timeout ?? 120,
        proxy: config.proxy || "",
        custom_headers: config.custom_headers || {},
        configured_models: defaultModelsList,
        device: config.model_kwargs?.device || config.device || "auto",
        normalize_embeddings:
          config.encode_kwargs?.normalize_embeddings ?? config.normalize_embeddings ?? true
      };

      setFormData(savedObj);
      initialFormDataRef.current = JSON.stringify(savedObj);
      setModelTestResults({});
      setHasUnsavedChanges(false);
      setIsSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (providerIdToDelete?: string) => {
    const targetId = providerIdToDelete || selectedProviderId;
    if (!targetId) return;
    setProviderToDelete(targetId);
    setShowDeleteModal(true);
  };

  const confirmDeleteProvider = async () => {
    if (!providerToDelete || !token) return;
    setShowDeleteModal(false);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/providers/${providerToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to delete provider");
      }
      if (providerToDelete === selectedProviderId) {
        setSelectedProviderId(null);
      }
      await fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete provider");
    } finally {
      setSaving(false);
      setProviderToDelete(null);
    }
  };

  const handleFetchModelList = async () => {
    if (!token) return;
    setFetchingModels(true);
    try {
      const res = await fetch("/api/providers/fetch-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          provider_id: formData.provider_id,
          base_url: formData.base_url,
          api_key: formData.api_key,
          provider_type: formData.provider_type
        })
      });
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.models)) {
        setAvailableModels(data.models);
        setAvailableModelsByCategory((prev) => ({ ...prev, [activeTab]: data.models }));
      } else {
        setAvailableModels([]);
        setAvailableModelsByCategory((prev) => ({ ...prev, [activeTab]: [] }));
      }
    } catch {
      setAvailableModels([]);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleDownloadModel = async (
    modelId: string,
    modelName?: string,
    isVision?: boolean,
    isAudio?: boolean,
    isTools?: boolean,
    isReasoning?: boolean,
    ctxLen?: string
  ) => {
    if (!token || downloadingModelId) return;
    setDownloadingModelId(modelId);
    setError(null);

    // Notify global widget
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("model-download-started", { detail: { model_id: modelId } })
      );
    }

    setDownloadProgress((prev) => ({
      ...prev,
      [modelId]: {
        model_id: modelId,
        status: "starting",
        progress: 0,
        downloaded_bytes: 0,
        total_bytes: 0,
        message: "Starting download..."
      }
    }));

    const onDownloadSuccess = () => {
      setAvailableModels((prev) =>
        prev.map((item) =>
          item.id === modelId ? { ...item, is_downloaded: true, is_downloading: false } : item
        )
      );

      setAvailableModelsByCategory((prev) => {
        const updated: Record<string, AvailableModelItem[]> = {};
        for (const [cat, list] of Object.entries(prev)) {
          updated[cat] = list.map((item) =>
            item.id === modelId ? { ...item, is_downloaded: true, is_downloading: false } : item
          );
        }
        return updated;
      });

      const cleanId = cleanRawModelId(modelId);
      const newModel: ConfiguredModel = {
        id: cleanId,
        name: cleanRawModelId(modelName || modelId),
        is_active: true,
        has_vision: isVision,
        has_audio: isAudio,
        has_tools: isTools,
        has_reasoning: isReasoning,
        context_length: ctxLen
      };
      updateFormData((prev) => ({
        ...prev,
        configured_models: [...prev.configured_models.filter((cm) => cm.id !== cleanId), newModel]
      }));
    };

    try {
      const res = await fetch("/api/providers/download-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          model_name: modelId,
          provider_type: formData.provider_type
        })
      });
      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data.message || `Failed to download model ${modelId}`);
      }

      if (data.status === "completed") {
        setDownloadProgress((prev) => ({
          ...prev,
          [modelId]: {
            model_id: modelId,
            status: "completed",
            progress: 100,
            downloaded_bytes: 0,
            total_bytes: 0,
            message: "Downloaded successfully"
          }
        }));
        onDownloadSuccess();
        setTimeout(() => {
          setDownloadingModelId((current) => (current === modelId ? null : current));
        }, 1500);
        return;
      }

      // Poll progress every 2000ms
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(
            `/api/providers/download-progress?model_id=${encodeURIComponent(modelId)}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          if (!pollRes.ok) return;
          const pollData: DownloadProgressInfo = await pollRes.json();

          setDownloadProgress((prev) => ({
            ...prev,
            [modelId]: pollData
          }));

          if (pollData.status === "completed") {
            clearInterval(pollInterval);
            onDownloadSuccess();
            setTimeout(() => {
              setDownloadingModelId((current) => (current === modelId ? null : current));
            }, 2000);
          } else if (pollData.status === "error") {
            clearInterval(pollInterval);
            setError(pollData.error || pollData.message || `Failed to download model ${modelId}`);
            setDownloadingModelId((current) => (current === modelId ? null : current));
          } else if (pollData.status === "not_found") {
            clearInterval(pollInterval);
            setDownloadingModelId((current) => (current === modelId ? null : current));
          }
        } catch {
          // ignore transient poll errors
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download model");
      setDownloadingModelId(null);
    }
  };

  const handleAddCustomModel = (newModel: ConfiguredModel) => {
    updateFormData((prev) => ({
      ...prev,
      configured_models: [...prev.configured_models.filter((m) => m.id !== newModel.id), newModel]
    }));
  };

  const handleToggleModelActive = (modelId: string) => {
    updateFormData((prev) => ({
      ...prev,
      configured_models: prev.configured_models.map((m) =>
        m.id === modelId ? { ...m, is_active: !m.is_active } : m
      )
    }));
  };

  const handleDeleteConfiguredModel = (modelId: string) => {
    updateFormData((prev) => ({
      ...prev,
      configured_models: prev.configured_models.filter((m) => m.id !== modelId)
    }));
  };

  const handleTestModel = async (modelId: string) => {
    if (!token) return;
    setTestingModelId(modelId);
    try {
      const res = await fetch("/api/providers/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          provider_id: modelId,
          category: activeTab,
          provider_type: formData.provider_type,
          base_url: formData.base_url,
          api_key: formData.api_key,
          model_name: modelId,
          config: { timeout: formData.timeout }
        })
      });

      const data = await res.json();
      const isSuccess = data.status === "ok" || data.status === "success";
      const resultObj: TestResult = {
        status: isSuccess ? "success" : "error",
        message: isSuccess ? "Connected!" : data.message || "Failed to test connection"
      };
      setModelTestResults((prev) => ({ ...prev, [modelId]: resultObj }));
    } catch (err) {
      const errObj: TestResult = {
        status: "error",
        message: err instanceof Error ? err.message : "Failed to test connection"
      };
      setModelTestResults((prev) => ({ ...prev, [modelId]: errObj }));
    } finally {
      setTestingModelId(null);
    }
  };

  const filteredPresets = PROVIDER_PRESETS.filter((preset) => {
    if (activeTab === "parser") {
      const allowed = ["llamaindex"];
      if (!allowed.includes(preset.type)) return false;
    } else if (activeTab === "embedding") {
      const allowed = ["openai", "gemini", "huggingface", "ollama"];
      if (!allowed.includes(preset.type)) return false;
    } else if (activeTab === "chat") {
      const allowed = ["openai", "anthropic", "gemini", "huggingface", "deepseek", "ollama", "openrouter"];
      if (!allowed.includes(preset.type)) return false;
    }
    if (!presetSearch.trim()) return true;
    return (
      preset.label.toLowerCase().includes(presetSearch.toLowerCase()) ||
      preset.type.toLowerCase().includes(presetSearch.toLowerCase())
    );
  });

  return (
    <div
      style={{
        minHeight: "100%",
        backgroundColor: "var(--background)",
        padding: "28px 40px 60px 40px",
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "var(--foreground)"
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* PAGE HEADER */}
        <header>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "var(--foreground)", marginTop: "4px", letterSpacing: "-0.01em" }}>
            Model Providers
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginTop: "4px" }}>
            Configure AI LLM model providers, embedding models, and document parsing engines.
          </p>
        </header>

        {/* ERROR ALERT */}
        {error && (
          <div
            style={{
              border: "1px solid var(--destructive)",
              padding: "12px 16px",
              borderRadius: "8px",
              background: "var(--color-peach-soft)",
              color: "var(--destructive)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px"
            }}
          >
            <AlertCircle style={{ width: "18px", height: "18px", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* 3 CATEGORY TABS: CHAT, EMBEDDING, PARSER */}
        <div style={{ borderBottom: "1px solid var(--border)", display: "flex", gap: "24px" }}>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("chat")}
            style={{
              padding: "12px 4px",
              fontSize: "15px",
              fontWeight: "600",
              color: activeTab === "chat" ? "var(--primary)" : "var(--muted-foreground)",
              borderBottom: activeTab === "chat" ? "2px solid var(--primary)" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: 0
            }}
          >
            <MessageSquare style={{ width: "17px", height: "17px", color: activeTab === "chat" ? "var(--primary)" : "inherit" }} />
            <span>Chat</span>
            <span
              style={{
                fontSize: "11px",
                background: activeTab === "chat" ? "var(--accent)" : "var(--muted)",
                color: activeTab === "chat" ? "var(--accent-foreground)" : "var(--muted-foreground)",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: "bold"
              }}
            >
              {providers.filter((p) => p.category === "chat").length}
            </span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab("embedding")}
            style={{
              padding: "12px 4px",
              fontSize: "15px",
              fontWeight: "600",
              color: activeTab === "embedding" ? "var(--primary)" : "var(--muted-foreground)",
              borderBottom: activeTab === "embedding" ? "2px solid var(--primary)" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: 0
            }}
          >
            <Binary style={{ width: "17px", height: "17px", color: activeTab === "embedding" ? "var(--primary)" : "inherit" }} />
            <span>Embedding</span>
            <span
              style={{
                fontSize: "11px",
                background: activeTab === "embedding" ? "var(--accent)" : "var(--muted)",
                color: activeTab === "embedding" ? "var(--accent-foreground)" : "var(--muted-foreground)",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: "bold"
              }}
            >
              {providers.filter((p) => p.category === "embedding").length}
            </span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab("parser")}
            style={{
              padding: "12px 4px",
              fontSize: "15px",
              fontWeight: "600",
              color: activeTab === "parser" ? "var(--primary)" : "var(--muted-foreground)",
              borderBottom: activeTab === "parser" ? "2px solid var(--primary)" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: 0
            }}
          >
            <FileText style={{ width: "17px", height: "17px", color: activeTab === "parser" ? "var(--primary)" : "inherit" }} />
            <span>Parser</span>
            <span
              style={{
                fontSize: "11px",
                background: activeTab === "parser" ? "var(--accent)" : "var(--muted)",
                color: activeTab === "parser" ? "var(--accent-foreground)" : "var(--muted-foreground)",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: "bold"
              }}
            >
              {providers.filter((p) => p.category === "parser").length}
            </span>
          </Button>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: "310px 1fr", gap: "20px", minHeight: "640px" }}>
          <ProviderSidebar
            activeTab={activeTab}
            providers={providers}
            categoryProviders={categoryProviders}
            selectedProviderId={selectedProviderId}
            onSelectProvider={(id) => setSelectedProviderId(id)}
            showAddMenu={showAddMenu}
            setShowAddMenu={setShowAddMenu}
            presetSearch={presetSearch}
            setPresetSearch={setPresetSearch}
            filteredPresets={filteredPresets}
            onAddPreset={handleAddPreset}
            onDeleteProvider={handleDelete}
            loading={loading}
            saving={saving}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          <ProviderSettingsPanel
            selectedProvider={selectedProvider}
            formData={formData}
            updateFormData={updateFormData}
            activeTab={activeTab}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaved={isSaved}
            saving={saving}
            onSave={handleSave}
            onOpenApiKeyModal={() => setShowApiKeyModal(true)}
            modelsDevMap={modelsDevMap}
            availableModels={availableModels}
            fetchingModels={fetchingModels}
            downloadingModelId={downloadingModelId}
            downloadProgress={downloadProgress}
            modelTestResults={modelTestResults}
            testingModelId={testingModelId}
            onFetchModelList={handleFetchModelList}
            onOpenCustomModelModal={() => setShowCustomModelModal(true)}
            onOpenModelSettings={(model) => {
              setEditingModel(model);
              setShowModelSettingsModal(true);
            }}
            onToggleModelActive={handleToggleModelActive}
            onDeleteConfiguredModel={handleDeleteConfiguredModel}
            onTestModel={handleTestModel}
            onDownloadModel={handleDownloadModel}
          />
        </div>

        {/* MODALS */}
        <ModelSettingsModal
          isOpen={showModelSettingsModal && !!editingModel}
          onClose={() => {
            setShowModelSettingsModal(false);
            setEditingModel(null);
          }}
          editingModel={editingModel}
          modelsDevMap={modelsDevMap}
          formData={formData}
          activeTab={activeTab}
          onSaveModel={(updatedModel) => {
            updateFormData((prev) => ({
              ...prev,
              configured_models: prev.configured_models.map((m) =>
                m.id === updatedModel.id ? updatedModel : m
              )
            }));
            setShowModelSettingsModal(false);
            setEditingModel(null);
          }}
        />

        <CustomModelModal
          isOpen={showCustomModelModal}
          onClose={() => setShowCustomModelModal(false)}
          providerName={formData.name}
          onAddCustomModel={handleAddCustomModel}
        />

        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          apiKey={formData.api_key}
          onConfirmApiKey={(combinedKey) => updateFormData({ api_key: combinedKey })}
        />

        <DeleteProviderModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirmDelete={confirmDeleteProvider}
        />
      </div>
    </div>
  );
}
