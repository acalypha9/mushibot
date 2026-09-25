"use client";

import { useEffect, useReducer, useCallback } from "react";
import { useAuth } from "@/app/auth";
import Button from "@/components/ui/Button";
import {
  AlertCircle,
  ArrowLeft,
  Sliders,
  Megaphone,
  BookOpen,
  Wifi,
  Bot,
} from "lucide-react";
import {
  WhatsAppStatus,
  TelegramStatus,
  ChannelItem,
  ModelOptionItem,
  WaGroupItem,
} from "./types";
import ChannelList from "./components/ChannelList";
import ChannelOverviewTab from "./components/ChannelOverviewTab";
import ConnectionTab from "./components/ConnectionTab";
import MessageLimitsTab from "./components/MessageLimitsTab";
import AiBotTab from "./components/AiBotTab";
import BroadcastTab from "./components/BroadcastTab";
import AddChannelModal from "./components/AddChannelModal";
import DeleteChannelModal from "./components/DeleteChannelModal";
import ResetConversationsModal from "./components/ResetConversationsModal";

// ==========================================
// 1. Channel Data & Connection Status State
// ==========================================
interface ChannelConnectionState {
  channels: ChannelItem[];
  selectedChannel: ChannelItem | null;
  detailTab: "overview" | "connection" | "message" | "bot" | "broadcast";
  waStatus: WhatsAppStatus | null;
  tgStatus: TelegramStatus | null;
  waStatusesMap: Record<string, WhatsAppStatus>;
  telegramStatusesMap: Record<string, TelegramStatus>;
  tgActionLoading: string | null;
  actionLoading: string | null;
  errorMsg: string | null;
  successMsg: string | null;
  loading: boolean;
  defaultModelName: string;
  configuredModelsList: ModelOptionItem[];
}

type ChannelConnectionAction =
  | { type: "SET_CHANNELS"; payload: ChannelItem[] | ((prev: ChannelItem[]) => ChannelItem[]) }
  | { type: "SET_SELECTED_CHANNEL"; payload: ChannelItem | null | ((prev: ChannelItem | null) => ChannelItem | null) }
  | { type: "SET_DETAIL_TAB"; payload: "overview" | "connection" | "message" | "bot" | "broadcast" }
  | { type: "SET_WA_STATUS"; payload: WhatsAppStatus | null }
  | { type: "SET_TG_STATUS"; payload: TelegramStatus | null }
  | { type: "SET_WA_STATUSES_MAP"; payload: Record<string, WhatsAppStatus> | ((prev: Record<string, WhatsAppStatus>) => Record<string, WhatsAppStatus>) }
  | { type: "SET_TELEGRAM_STATUSES_MAP"; payload: Record<string, TelegramStatus> | ((prev: Record<string, TelegramStatus>) => Record<string, TelegramStatus>) }
  | { type: "SET_TG_ACTION_LOADING"; payload: string | null }
  | { type: "SET_ACTION_LOADING"; payload: string | null }
  | { type: "SET_ERROR_MSG"; payload: string | null }
  | { type: "SET_SUCCESS_MSG"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_MODELS_DATA"; payload: { defaultModelName: string; configuredModelsList: ModelOptionItem[] } };

function channelConnectionReducer(state: ChannelConnectionState, action: ChannelConnectionAction): ChannelConnectionState {
  switch (action.type) {
    case "SET_CHANNELS":
      return {
        ...state,
        channels: typeof action.payload === "function" ? action.payload(state.channels) : action.payload,
      };
    case "SET_SELECTED_CHANNEL":
      return {
        ...state,
        selectedChannel: typeof action.payload === "function" ? action.payload(state.selectedChannel) : action.payload,
      };
    case "SET_DETAIL_TAB":
      return { ...state, detailTab: action.payload };
    case "SET_WA_STATUS":
      return { ...state, waStatus: action.payload };
    case "SET_TG_STATUS":
      return { ...state, tgStatus: action.payload };
    case "SET_WA_STATUSES_MAP":
      return {
        ...state,
        waStatusesMap: typeof action.payload === "function" ? action.payload(state.waStatusesMap) : action.payload,
      };
    case "SET_TELEGRAM_STATUSES_MAP":
      return {
        ...state,
        telegramStatusesMap: typeof action.payload === "function" ? action.payload(state.telegramStatusesMap) : action.payload,
      };
    case "SET_TG_ACTION_LOADING":
      return { ...state, tgActionLoading: action.payload };
    case "SET_ACTION_LOADING":
      return { ...state, actionLoading: action.payload };
    case "SET_ERROR_MSG":
      return { ...state, errorMsg: action.payload };
    case "SET_SUCCESS_MSG":
      return { ...state, successMsg: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_MODELS_DATA":
      return {
        ...state,
        defaultModelName: action.payload.defaultModelName,
        configuredModelsList: action.payload.configuredModelsList,
      };
    default:
      return state;
  }
}

// ==========================================
// 2. Channel Configuration Form State
// ==========================================
interface ChannelConfigFormState {
  cfgName: string;
  cfgDesc: string;
  cfgTgToken: string;
  cfgAutoReply: boolean;
  cfgRateLimit: number;
  cfgMaxTokens: number;
  cfgTimeout: number;
  cfgSessionTimeout: number;
  cfgTypingDelay: number;
  cfgReplyMode: "all" | "specific";
  cfgAllowPrivate: boolean;
  cfgAllowGroup: boolean;
  cfgCommandPrefix: string;
  cfgWhitelistList: string[];
  cfgBlacklistList: string[];
  editingWhitelistIdx: number | null;
  editingBlacklistIdx: number | null;
  channelCountryCode: string;
  waGroups: WaGroupItem[];
  loadingWaGroups: boolean;
  showGroupPicker: boolean;
  showBlGroupPicker: boolean;
  cfgSystemPrompt: string;
  cfgModel: string;
  cfgRetrievalK: number;
  isSaved: boolean;
}

type ChannelConfigFormAction =
  | { type: "SET_FIELD"; field: keyof ChannelConfigFormState; payload: any }
  | { type: "RESET_FORM"; payload: Partial<ChannelConfigFormState> };

function channelConfigFormReducer(state: ChannelConfigFormState, action: ChannelConfigFormAction): ChannelConfigFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.payload };
    case "RESET_FORM":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ==========================================
// 3. UI, Modals, Pairing & Broadcast State
// ==========================================
interface ChannelUiModalState {
  // QR Pairing
  showPairingQR: boolean;
  qrTimer: number;
  qrExpired: boolean;
  activeQrUrl: string | null;
  // Reset Conversations
  resettingConversations: boolean;
  resetSuccessMsg: string | null;
  showResetConfirmModal: boolean;
  // Broadcast
  broadcastRecipients: string;
  broadcastMessage: string;
  broadcastSending: boolean;
  broadcastResult: string | null;
  // Modals & New Channel Form
  showAddModal: boolean;
  showDeleteModal: ChannelItem | null;
  newChannelType: "WHATSAPP" | "TELEGRAM";
  newChannelName: string;
  newChannelDesc: string;
  newChannelAutoReply: boolean;
  newChannelModel: string;
  addChannelError: string | null;
}

type ChannelUiModalAction =
  | { type: "SET_FIELD"; field: keyof ChannelUiModalState; payload: any }
  | { type: "RESET_NEW_CHANNEL_FORM" }
  | { type: "DECREMENT_QR_TIMER" };

function channelUiModalReducer(state: ChannelUiModalState, action: ChannelUiModalAction): ChannelUiModalState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.payload };
    case "RESET_NEW_CHANNEL_FORM":
      return {
        ...state,
        newChannelType: "WHATSAPP",
        newChannelName: "",
        newChannelDesc: "",
        newChannelAutoReply: true,
        newChannelModel: "",
        addChannelError: null,
        showAddModal: false,
      };
    case "DECREMENT_QR_TIMER":
      if (state.qrTimer <= 1) {
        return { ...state, qrTimer: 0, qrExpired: true };
      }
      return { ...state, qrTimer: state.qrTimer - 1 };
    default:
      return state;
  }
}

export default function ChannelPage() {
  const { user } = useAuth();
  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Reducer 1: Connection & Channels Data State
  const [dataState, dispatchData] = useReducer(channelConnectionReducer, {
    channels: [],
    selectedChannel: null,
    detailTab: "overview",
    waStatus: null,
    tgStatus: null,
    waStatusesMap: {},
    telegramStatusesMap: {},
    tgActionLoading: null,
    actionLoading: null,
    errorMsg: null,
    successMsg: null,
    loading: false,
    defaultModelName: "",
    configuredModelsList: [],
  });

  // Reducer 2: Config Form State
  const [formState, dispatchForm] = useReducer(channelConfigFormReducer, {
    cfgName: "",
    cfgDesc: "",
    cfgTgToken: "",
    cfgAutoReply: true,
    cfgRateLimit: 5,
    cfgMaxTokens: 500,
    cfgTimeout: 30,
    cfgSessionTimeout: 300,
    cfgTypingDelay: 1000,
    cfgReplyMode: "all",
    cfgAllowPrivate: true,
    cfgAllowGroup: true,
    cfgCommandPrefix: ".ai",
    cfgWhitelistList: [],
    cfgBlacklistList: [],
    editingWhitelistIdx: null,
    editingBlacklistIdx: null,
    channelCountryCode: "",
    waGroups: [],
    loadingWaGroups: false,
    showGroupPicker: false,
    showBlGroupPicker: false,
    cfgSystemPrompt: "",
    cfgModel: "",
    cfgRetrievalK: 3,
    isSaved: false,
  });

  // Reducer 3: UI, Modals, Pairing & Broadcast State
  const [uiState, dispatchUi] = useReducer(channelUiModalReducer, {
    showPairingQR: false,
    qrTimer: 60,
    qrExpired: false,
    activeQrUrl: null,
    resettingConversations: false,
    resetSuccessMsg: null,
    showResetConfirmModal: false,
    broadcastRecipients: "",
    broadcastMessage: "",
    broadcastSending: false,
    broadcastResult: null,
    showAddModal: false,
    showDeleteModal: null,
    newChannelType: "WHATSAPP",
    newChannelName: "",
    newChannelDesc: "",
    newChannelAutoReply: true,
    newChannelModel: "",
    addChannelError: null,
  });

  const {
    channels,
    selectedChannel,
    detailTab,
    waStatus,
    tgStatus,
    waStatusesMap,
    telegramStatusesMap,
    tgActionLoading,
    actionLoading,
    errorMsg,
    defaultModelName,
    configuredModelsList,
  } = dataState;

  const {
    cfgName,
    cfgDesc,
    cfgTgToken,
    cfgAutoReply,
    cfgRateLimit,
    cfgMaxTokens,
    cfgTimeout,
    cfgSessionTimeout,
    cfgTypingDelay,
    cfgReplyMode,
    cfgAllowPrivate,
    cfgAllowGroup,
    cfgCommandPrefix,
    cfgWhitelistList,
    cfgBlacklistList,
    editingWhitelistIdx,
    editingBlacklistIdx,
    channelCountryCode,
    waGroups,
    loadingWaGroups,
    showGroupPicker,
    showBlGroupPicker,
    cfgSystemPrompt,
    cfgModel,
    cfgRetrievalK,
    isSaved,
  } = formState;

  const {
    showPairingQR,
    qrTimer,
    qrExpired,
    activeQrUrl,
    resettingConversations,
    resetSuccessMsg,
    showResetConfirmModal,
    broadcastRecipients,
    broadcastMessage,
    broadcastSending,
    broadcastResult,
    showAddModal,
    showDeleteModal,
    newChannelType,
    newChannelName,
    newChannelDesc,
    newChannelAutoReply,
    newChannelModel,
    addChannelError,
  } = uiState;

  const setChannels = useCallback(
    (payload: ChannelItem[] | ((prev: ChannelItem[]) => ChannelItem[])) => {
      dispatchData({ type: "SET_CHANNELS", payload });
    },
    []
  );

  const setSelectedChannel = useCallback(
    (payload: ChannelItem | null | ((prev: ChannelItem | null) => ChannelItem | null)) => {
      dispatchData({ type: "SET_SELECTED_CHANNEL", payload });
    },
    []
  );

  const setDetailTab = useCallback(
    (payload: "overview" | "connection" | "message" | "bot" | "broadcast") => {
      dispatchData({ type: "SET_DETAIL_TAB", payload });
    },
    []
  );

  const setWaStatus = useCallback((payload: WhatsAppStatus | null) => {
    dispatchData({ type: "SET_WA_STATUS", payload });
  }, []);

  const setTgStatus = useCallback((payload: TelegramStatus | null) => {
    dispatchData({ type: "SET_TG_STATUS", payload });
  }, []);

  const setWaStatusesMap = useCallback(
    (payload: Record<string, WhatsAppStatus> | ((prev: Record<string, WhatsAppStatus>) => Record<string, WhatsAppStatus>)) => {
      dispatchData({ type: "SET_WA_STATUSES_MAP", payload });
    },
    []
  );

  const setTelegramStatusesMap = useCallback(
    (payload: Record<string, TelegramStatus> | ((prev: Record<string, TelegramStatus>) => Record<string, TelegramStatus>)) => {
      dispatchData({ type: "SET_TELEGRAM_STATUSES_MAP", payload });
    },
    []
  );

  const setTgActionLoading = useCallback((payload: string | null) => {
    dispatchData({ type: "SET_TG_ACTION_LOADING", payload });
  }, []);

  const setActionLoading = useCallback((payload: string | null) => {
    dispatchData({ type: "SET_ACTION_LOADING", payload });
  }, []);

  const setErrorMsg = useCallback((payload: string | null) => {
    dispatchData({ type: "SET_ERROR_MSG", payload });
  }, []);

  const setSuccessMsg = useCallback((payload: string | null) => {
    dispatchData({ type: "SET_SUCCESS_MSG", payload });
  }, []);

  const setLoading = useCallback((payload: boolean) => {
    dispatchData({ type: "SET_LOADING", payload });
  }, []);

  // Form field setters
  const setCfgName = (val: string) => dispatchForm({ type: "SET_FIELD", field: "cfgName", payload: val });
  const setCfgDesc = (val: string) => dispatchForm({ type: "SET_FIELD", field: "cfgDesc", payload: val });
  const setCfgTgToken = (val: string) => dispatchForm({ type: "SET_FIELD", field: "cfgTgToken", payload: val });
  const setCfgAutoReply = (val: boolean) => dispatchForm({ type: "SET_FIELD", field: "cfgAutoReply", payload: val });
  const setCfgRateLimit = (val: number) => dispatchForm({ type: "SET_FIELD", field: "cfgRateLimit", payload: val });
  const setCfgMaxTokens = (val: number) => dispatchForm({ type: "SET_FIELD", field: "cfgMaxTokens", payload: val });
  const setCfgTimeout = (val: number) => dispatchForm({ type: "SET_FIELD", field: "cfgTimeout", payload: val });
  const setCfgSessionTimeout = (val: number) => dispatchForm({ type: "SET_FIELD", field: "cfgSessionTimeout", payload: val });
  const setCfgTypingDelay = (val: number) => dispatchForm({ type: "SET_FIELD", field: "cfgTypingDelay", payload: val });
  const setCfgReplyMode = (val: "all" | "specific") => dispatchForm({ type: "SET_FIELD", field: "cfgReplyMode", payload: val });
  const setCfgAllowPrivate = (val: boolean) => dispatchForm({ type: "SET_FIELD", field: "cfgAllowPrivate", payload: val });
  const setCfgAllowGroup = (val: boolean) => dispatchForm({ type: "SET_FIELD", field: "cfgAllowGroup", payload: val });
  const setCfgCommandPrefix = (val: string) => dispatchForm({ type: "SET_FIELD", field: "cfgCommandPrefix", payload: val });
  const setCfgWhitelistList = (val: string[] | ((prev: string[]) => string[])) =>
    dispatchForm({
      type: "SET_FIELD",
      field: "cfgWhitelistList",
      payload: typeof val === "function" ? val(cfgWhitelistList) : val,
    });
  const setCfgBlacklistList = (val: string[] | ((prev: string[]) => string[])) =>
    dispatchForm({
      type: "SET_FIELD",
      field: "cfgBlacklistList",
      payload: typeof val === "function" ? val(cfgBlacklistList) : val,
    });
  const setEditingWhitelistIdx = (val: number | null) => dispatchForm({ type: "SET_FIELD", field: "editingWhitelistIdx", payload: val });
  const setEditingBlacklistIdx = (val: number | null) => dispatchForm({ type: "SET_FIELD", field: "editingBlacklistIdx", payload: val });
  const setChannelCountryCode = (val: string) => dispatchForm({ type: "SET_FIELD", field: "channelCountryCode", payload: val });
  const setWaGroups = (val: WaGroupItem[]) => dispatchForm({ type: "SET_FIELD", field: "waGroups", payload: val });
  const setLoadingWaGroups = (val: boolean) => dispatchForm({ type: "SET_FIELD", field: "loadingWaGroups", payload: val });
  const setShowGroupPicker = (val: boolean) => dispatchForm({ type: "SET_FIELD", field: "showGroupPicker", payload: val });
  const setShowBlGroupPicker = (val: boolean) => dispatchForm({ type: "SET_FIELD", field: "showBlGroupPicker", payload: val });
  const setCfgSystemPrompt = (val: string) => dispatchForm({ type: "SET_FIELD", field: "cfgSystemPrompt", payload: val });
  const setCfgModel = (val: string) => dispatchForm({ type: "SET_FIELD", field: "cfgModel", payload: val });
  const setCfgRetrievalK = (val: number) => dispatchForm({ type: "SET_FIELD", field: "cfgRetrievalK", payload: val });
  const setIsSaved = (val: boolean) => dispatchForm({ type: "SET_FIELD", field: "isSaved", payload: val });

  // UI state setters
  const setShowPairingQR = (val: boolean) => dispatchUi({ type: "SET_FIELD", field: "showPairingQR", payload: val });
  const setQrTimer = (val: number | ((prev: number) => number)) =>
    dispatchUi({
      type: "SET_FIELD",
      field: "qrTimer",
      payload: typeof val === "function" ? val(qrTimer) : val,
    });
  const setQrExpired = (val: boolean) => dispatchUi({ type: "SET_FIELD", field: "qrExpired", payload: val });
  const setActiveQrUrl = (val: string | null) => dispatchUi({ type: "SET_FIELD", field: "activeQrUrl", payload: val });
  const setResettingConversations = (val: boolean) => dispatchUi({ type: "SET_FIELD", field: "resettingConversations", payload: val });
  const setResetSuccessMsg = (val: string | null) => dispatchUi({ type: "SET_FIELD", field: "resetSuccessMsg", payload: val });
  const setShowResetConfirmModal = (val: boolean) => dispatchUi({ type: "SET_FIELD", field: "showResetConfirmModal", payload: val });
  const setBroadcastRecipients = (val: string) => dispatchUi({ type: "SET_FIELD", field: "broadcastRecipients", payload: val });
  const setBroadcastMessage = (val: string) => dispatchUi({ type: "SET_FIELD", field: "broadcastMessage", payload: val });
  const setBroadcastSending = (val: boolean) => dispatchUi({ type: "SET_FIELD", field: "broadcastSending", payload: val });
  const setBroadcastResult = (val: string | null) => dispatchUi({ type: "SET_FIELD", field: "broadcastResult", payload: val });
  const setShowAddModal = (val: boolean) => dispatchUi({ type: "SET_FIELD", field: "showAddModal", payload: val });
  const setShowDeleteModal = (val: ChannelItem | null) => dispatchUi({ type: "SET_FIELD", field: "showDeleteModal", payload: val });
  const setNewChannelType = (val: "WHATSAPP" | "TELEGRAM") => dispatchUi({ type: "SET_FIELD", field: "newChannelType", payload: val });
  const setNewChannelName = (val: string) => dispatchUi({ type: "SET_FIELD", field: "newChannelName", payload: val });
  const setNewChannelDesc = (val: string) => dispatchUi({ type: "SET_FIELD", field: "newChannelDesc", payload: val });
  const setNewChannelAutoReply = (val: boolean) => dispatchUi({ type: "SET_FIELD", field: "newChannelAutoReply", payload: val });
  const setNewChannelModel = (val: string) => dispatchUi({ type: "SET_FIELD", field: "newChannelModel", payload: val });
  const setAddChannelError = (val: string | null) => dispatchUi({ type: "SET_FIELD", field: "addChannelError", payload: val });

  const fetchWaGroups = useCallback(async (chanId?: string, force: boolean = false) => {
    try {
      setLoadingWaGroups(true);
      const targetId = chanId || selectedChannel?.id || "default";
      const url = `/api/channel/whatsapp?action=groups&channel_id=${targetId}${force ? "&refresh=true" : ""}`;
      const res = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      if (data.groups && Array.isArray(data.groups)) {
        setWaGroups(data.groups);
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp groups:", err);
    } finally {
      setLoadingWaGroups(false);
    }
  }, [selectedChannel?.id]);

  const getRecipientDisplayInfo = (recItem: string) => {
    const item = recItem.trim();
    if (!item) return { title: "", subtitle: null, isGroup: false };

    const matched = waGroups.find(
      (g) =>
        g.id.toLowerCase() === item.toLowerCase() ||
        g.id.replace(/@g\.us$/, "").toLowerCase() === item.replace(/@g\.us$/, "").toLowerCase()
    );
    if (matched) {
      return {
        title: matched.subject,
        subtitle: matched.id,
        isGroup: true,
      };
    }

    if (item.includes("@g.us") || item.startsWith("120363") || /^\d{15,25}$/.test(item.replace(/[^\d]/g, ""))) {
      return {
        title: "WhatsApp Group",
        subtitle: item.endsWith("@g.us") ? item : `${item}@g.us`,
        isGroup: true,
      };
    }

    return {
      title: item,
      subtitle: null,
      isGroup: false,
    };
  };

  // Fetch configured active chat model providers
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
        const res = await fetch("/api/providers", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          const list: ModelOptionItem[] = [];
          let defName = "";
          for (const p of data) {
            if (!p.is_active || p.category !== "chat") continue;
            const models = p.config?.configured_models || [];
            const activeModels = models.filter((cm: any) => cm.is_active !== false);

            for (const cm of activeModels) {
              const fullId = cm.id.includes("/") ? cm.id : `${p.name}/${cm.id}`;
              list.push({
                id: fullId,
                name: fullId,
                providerType: p.provider_type || p.type || p.name,
                providerName: p.name,
              });
            }

            const cleanModelName = (p.model_name || "").toLowerCase() === "deepseek-v4-pro" ? "" : p.model_name;
            if (activeModels.length === 0 && cleanModelName) {
              const modelId = cleanModelName.includes("/") ? cleanModelName : `${p.name}/${cleanModelName}`;
              list.push({
                id: modelId,
                name: modelId,
                providerType: p.provider_type || p.type || p.name,
                providerName: p.name,
              });
            }

            if (p.is_default && !defName) {
              if (activeModels.length > 0) {
                const firstId = activeModels[0].id;
                defName = firstId.includes("/") ? firstId : `${p.name}/${firstId}`;
              } else if (cleanModelName) {
                defName = cleanModelName.includes("/") ? cleanModelName : `${p.name}/${cleanModelName}`;
              }
            }
          }
          if (!defName && list.length > 0) {
            defName = list[0].id;
          }
          dispatchData({
            type: "SET_MODELS_DATA",
            payload: { defaultModelName: defName, configuredModelsList: list },
          });

          // Clean/sanitize saved channels whose model no longer exists in configured models list
          if (list.length > 0) {
            setChannels((prev) => {
              let updated = false;
              const newList = prev.map((c) => {
                if (c.model && !list.some((m) => m.id === c.model || m.name === c.model)) {
                  updated = true;
                  return { ...c, model: undefined };
                }
                return c;
              });
              if (updated) {
                try {
                  localStorage.setItem("csa_configured_channels", JSON.stringify(newList));
                } catch (e) {
                  console.error("Failed to update sanitized channels in localStorage:", e);
                }
              }
              return newList;
            });
          }
        }
      } catch (err) {
        console.error("Failed to load providers list:", err);
      }
    };
    fetchModels();
  }, [setChannels]);

  // Load Channels from Server Store
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const res = await fetch("/api/channel/list", { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.channels)) {
            setChannels(data.channels);
            try {
              localStorage.setItem("csa_configured_channels", JSON.stringify(data.channels));
            } catch (e) {
              console.error("Failed to save channels to localStorage:", e);
            }
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load channels from server:", e);
      }

      // Offline fallback: load from localStorage only if server is unreachable
      try {
        const saved = localStorage.getItem("csa_configured_channels");
        if (saved) {
          const localList = JSON.parse(saved);
          if (Array.isArray(localList)) {
            setChannels(localList);
          }
        }
      } catch (e) {
        console.error("Failed to load saved channels from localStorage fallback:", e);
      }
    };

    loadChannels();
  }, [setChannels]);

  // Fetch WhatsApp Baileys status for selectedChannel and background poll all active WA channels
  const fetchWaStatus = useCallback(async () => {
    try {
      setLoading(true);
      const targetId = selectedChannel?.id || "default";
       const res = await fetch(`/api/channel/whatsapp?channel_id=${targetId}`, { headers: authHeaders() });
      if (res.ok) {
        const data: WhatsAppStatus = await res.json();
        setWaStatus(data);
        if (selectedChannel?.id) {
          setWaStatusesMap((prev) => ({ ...prev, [selectedChannel.id]: data }));
        }
      }

      for (const chan of channels) {
        if (chan.type === "WHATSAPP" && chan.id !== selectedChannel?.id) {
          fetch(`/api/channel/whatsapp?channel_id=${chan.id}`, { headers: authHeaders() })
            .then((r) => (r.ok ? r.json().catch(() => null) : null))
            .then((d: WhatsAppStatus | null) => {
              if (d && d.status) {
                setWaStatusesMap((prev) => ({ ...prev, [chan.id]: d }));
              }
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error loading WhatsApp status");
    } finally {
      setLoading(false);
    }
  }, [selectedChannel, channels, setLoading, setWaStatus, setWaStatusesMap, setErrorMsg]);

  // Fetch Telegram GrammY status
  const fetchTgStatus = useCallback(async () => {
    try {
      const targetId = selectedChannel?.id || "default";
       const res = await fetch(`/api/channel/telegram?channel_id=${targetId}`, { headers: authHeaders() });
      if (res.ok) {
        const data: TelegramStatus | null = await res.json().catch(() => null);
        if (data) {
          setTgStatus(data);
          if (selectedChannel?.id) {
            setTelegramStatusesMap((prev) => ({ ...prev, [selectedChannel.id]: data }));
          }
        }
      }

      for (const chan of channels) {
        if (chan.type === "TELEGRAM" && chan.id !== selectedChannel?.id) {
          fetch(`/api/channel/telegram?channel_id=${chan.id}`, { headers: authHeaders() })
            .then((r) => (r.ok ? r.json().catch(() => null) : null))
            .then((d: TelegramStatus | null) => {
              if (d && d.status) {
                setTelegramStatusesMap((prev) => ({ ...prev, [chan.id]: d }));
              }
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error("Error fetching Telegram status:", err);
    }
  }, [selectedChannel?.id, channels, cfgTgToken, setTgStatus, setTelegramStatusesMap]);

  useEffect(() => {
    fetchWaStatus();
    fetchTgStatus();
    const interval = setInterval(() => {
      fetchWaStatus();
      fetchTgStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchWaStatus, fetchTgStatus]);

  // Auto-bind active WhatsApp phone to the active selectedChannel or primary WA channel
  useEffect(() => {
    if (waStatus?.status === "CONNECTED" && waStatus?.userInfo?.phone && channels.length > 0) {
      const connectedPhone = waStatus.userInfo.phone;
      setChannels((prev) => {
        let targetId = selectedChannel?.type === "WHATSAPP" ? selectedChannel.id : null;
        if (!targetId) {
          const target = prev.find((c) => c.type === "WHATSAPP" && !c.boundPhone) || prev.find((c) => c.type === "WHATSAPP");
          targetId = target?.id || null;
        }
        if (!targetId) return prev;

        const updated = prev.map((c) => (c.id === targetId ? { ...c, boundPhone: connectedPhone } : c));
        try {
          localStorage.setItem("csa_configured_channels", JSON.stringify(updated));
        } catch (e) {
          console.error("Error saving updated channels to localStorage:", e);
        }
        return updated;
      });

      setShowPairingQR(false);
      setQrExpired(false);
      setActiveQrUrl(null);
    }
  }, [waStatus?.status, waStatus?.userInfo?.phone, selectedChannel?.id, selectedChannel?.type, channels.length, setChannels]);

  // Keep selectedChannel object in sync with channels array updates
  useEffect(() => {
    if (selectedChannel) {
      const fresh = channels.find((c) => c.id === selectedChannel.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(selectedChannel)) {
        setSelectedChannel(fresh);
      }
    }
  }, [channels, selectedChannel, setSelectedChannel]);

  const handleResetConversations = async () => {
    try {
      setResettingConversations(true);
      setErrorMsg(null);
      const chan = selectedChannel?.type || "WHATSAPP";
       const res = await fetch(`/api/chat/channel-reset?channel=${chan}`, {
         method: "POST",
         headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to reset conversations.");
      }
      const total = data.total_sessions ?? data.count ?? 0;
      setResetSuccessMsg(`${total} session${total === 1 ? "" : "s"} reset`);
      setTimeout(() => setResetSuccessMsg(null), 5000);
    } catch (err) {
      console.error("Error resetting conversations:", err);
      setErrorMsg(err instanceof Error ? err.message : "Error resetting conversations.");
    } finally {
      setResettingConversations(false);
    }
  };

  useEffect(() => {
    if (waStatus?.status === "QR_READY" && waStatus?.qrCodeDataUrl) {
      if (waStatus.qrCodeDataUrl !== activeQrUrl) {
        setActiveQrUrl(waStatus.qrCodeDataUrl);
        setQrTimer(60);
        setQrExpired(false);
      }
    }
  }, [waStatus?.qrCodeDataUrl, waStatus?.status, activeQrUrl]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (waStatus?.status === "QR_READY" && waStatus?.qrCodeDataUrl && qrTimer > 0 && !qrExpired) {
      timer = setInterval(() => {
        dispatchUi({ type: "DECREMENT_QR_TIMER" });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [waStatus?.status, waStatus?.qrCodeDataUrl, qrTimer, qrExpired]);

  const resetFormValues = useCallback((chan: ChannelItem) => {
    const mode = chan.replyMode || (chan.whitelist && chan.whitelist.trim() ? "specific" : "all");
    const parsedWl = chan.whitelist ? chan.whitelist.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const parsedBl = chan.blacklist ? chan.blacklist.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const isModelValid = chan.model && configuredModelsList.some((m) => m.id === chan.model || m.name === chan.model);

    dispatchForm({
      type: "RESET_FORM",
      payload: {
        cfgName: chan.name || "",
        cfgDesc: chan.description || "",
        cfgAutoReply: chan.autoReplyEnabled ?? true,
        cfgRateLimit: chan.messageRateLimit ?? 5,
        cfgMaxTokens: chan.maxTokens ?? 500,
        cfgTimeout: chan.timeoutSeconds ?? 30,
        cfgSessionTimeout: chan.sessionTimeoutSeconds ?? 300,
        cfgTypingDelay: chan.typingDelayMs ?? 1000,
        cfgReplyMode: mode,
        cfgAllowPrivate: chan.allowPrivate ?? true,
        cfgAllowGroup: chan.allowGroup ?? true,
        cfgCommandPrefix: chan.commandPrefix !== undefined ? chan.commandPrefix : ".ai",
        cfgWhitelistList: parsedWl,
        cfgBlacklistList: parsedBl,
        editingWhitelistIdx: null,
        editingBlacklistIdx: null,
        channelCountryCode: "",
        showGroupPicker: false,
        showBlGroupPicker: false,
        cfgSystemPrompt: chan.systemPrompt || "",
        cfgModel: isModelValid ? chan.model! : "",
        cfgRetrievalK: chan.retrievalK ?? 3,
        isSaved: false,
      },
    });

    if (chan.type === "WHATSAPP") {
      fetchWaGroups(chan.id);
    }
  }, [configuredModelsList, fetchWaGroups]);

  const hasUnsavedConnectionChanges = selectedChannel ? (
    cfgName.trim() !== (selectedChannel.name || "").trim() ||
    cfgDesc.trim() !== (selectedChannel.description || "").trim()
  ) : false;

  const initialReplyMode = selectedChannel?.replyMode || (selectedChannel?.whitelist && selectedChannel.whitelist.trim() ? "specific" : "all");
  const initialAllowPrivate = selectedChannel?.allowPrivate ?? true;
  const initialAllowGroup = selectedChannel?.allowGroup ?? true;
  const initialCommandPrefix = selectedChannel?.commandPrefix !== undefined ? selectedChannel.commandPrefix : ".ai";
  const initialWl = selectedChannel?.whitelist ? selectedChannel.whitelist.split(",").map((s) => s.trim()).filter(Boolean).join(",") : "";
  const currentWl = cfgWhitelistList.filter(Boolean).join(",");
  const initialBl = selectedChannel?.blacklist ? selectedChannel.blacklist.split(",").map((s) => s.trim()).filter(Boolean).join(",") : "";
  const currentBl = cfgBlacklistList.filter(Boolean).join(",");

  const hasUnsavedMessageChanges = selectedChannel ? (
    Number(cfgRateLimit) !== (selectedChannel.messageRateLimit ?? 5) ||
    Number(cfgMaxTokens) !== (selectedChannel.maxTokens ?? 500) ||
    Number(cfgTimeout) !== (selectedChannel.timeoutSeconds ?? 30) ||
    Number(cfgSessionTimeout) !== (selectedChannel.sessionTimeoutSeconds ?? 300) ||
    Number(cfgTypingDelay) !== (selectedChannel.typingDelayMs ?? 1000) ||
    cfgReplyMode !== initialReplyMode ||
    cfgAllowPrivate !== initialAllowPrivate ||
    cfgAllowGroup !== initialAllowGroup ||
    cfgCommandPrefix !== initialCommandPrefix ||
    currentWl !== initialWl ||
    currentBl !== initialBl
  ) : false;

  const hasUnsavedBotChanges = selectedChannel ? (
    cfgAutoReply !== (selectedChannel.autoReplyEnabled ?? true) ||
    cfgSystemPrompt.trim() !== (selectedChannel.systemPrompt || "").trim() ||
    cfgModel !== (selectedChannel.model || "") ||
    Number(cfgRetrievalK) !== (selectedChannel.retrievalK ?? 3)
  ) : false;

  // Sync configuration form values when selected channel changes
  useEffect(() => {
    if (selectedChannel) {
      resetFormValues(selectedChannel);
      setBroadcastResult(null);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [selectedChannel?.id, resetFormValues, setErrorMsg, setSuccessMsg]);

  // WhatsApp Action Handler
  const handleWaAction = async (action: "connect" | "disconnect" | "reset" | "toggle_autoreply", autoReplyVal?: boolean, systemPromptVal?: string, modelVal?: string) => {
    setActionLoading(action);
    setErrorMsg(null);
    if (action === "connect") {
      setShowPairingQR(true);
    }
    try {
      const targetId = selectedChannel?.id || "default";
       const res = await fetch("/api/channel/whatsapp", {
         method: "POST",
         headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          action,
          channel_id: targetId,
          autoReply: autoReplyVal !== undefined ? autoReplyVal : cfgAutoReply,
          systemPrompt: systemPromptVal !== undefined ? systemPromptVal : cfgSystemPrompt,
          model: modelVal !== undefined ? modelVal : cfgModel,
          channelName: selectedChannel?.name || cfgName,
          retrievalK: Number(cfgRetrievalK),
          timeoutSeconds: Number(cfgTimeout),
          sessionTimeoutSeconds: Number(cfgSessionTimeout),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setWaStatus(data);
      if (targetId) {
        setWaStatusesMap((prev) => ({ ...prev, [targetId]: data }));
      }

      if (action === "disconnect" || action === "reset") {
        setShowPairingQR(false);
        setWaStatus({
          status: "DISCONNECTED",
          qrCodeDataUrl: null,
          userInfo: null,
          autoReplyEnabled: true,
          lastError: null,
          updatedAt: new Date().toISOString(),
        });
      }

      if (action === "toggle_autoreply") {
        setSelectedChannel((prev) => (prev ? { ...prev, autoReplyEnabled: data.autoReplyEnabled } : null));
        setChannels((prev) => {
          const list = prev.map((c) => (c.id === selectedChannel?.id ? { ...c, autoReplyEnabled: data.autoReplyEnabled } : c));
          localStorage.setItem("csa_configured_channels", JSON.stringify(list));
          return list;
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Save Complete Channel Configurations Handler
  const handleSaveAllConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    handleWaAction("toggle_autoreply", cfgAutoReply, cfgSystemPrompt.trim(), cfgModel);

    const token = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
    if (cfgRetrievalK) {
      fetch("/api/knowledge/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          retrieval_k: Number(cfgRetrievalK)
        })
      }).catch((err) => console.error("Failed to sync retrieval_k from channel:", err));
    }

    if (selectedChannel && cfgName.trim()) {
      const trimmedName = cfgName.trim();
      const isDuplicate = channels.some(
        (c) => c.id !== selectedChannel.id && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (isDuplicate) {
        setErrorMsg(`A channel named "${trimmedName}" already exists. Please choose a unique name.`);
        return;
      }

      const finalWl = cfgReplyMode === "all" ? "" : cfgWhitelistList.filter(Boolean).join(", ");
      const finalBl = cfgBlacklistList.filter(Boolean).join(", ");

      const updated: ChannelItem = {
        ...selectedChannel,
        name: trimmedName,
        description: cfgDesc.trim() || undefined,
        autoReplyEnabled: cfgAutoReply,
        messageRateLimit: Number(cfgRateLimit),
        maxTokens: Number(cfgMaxTokens),
        timeoutSeconds: Number(cfgTimeout),
        sessionTimeoutSeconds: Number(cfgSessionTimeout),
        typingDelayMs: Number(cfgTypingDelay),
        replyMode: cfgReplyMode,
        allowPrivate: cfgAllowPrivate,
        allowGroup: cfgAllowGroup,
        whitelist: finalWl,
        blacklist: finalBl,
        commandPrefix: cfgCommandPrefix.trim(),
        systemPrompt: cfgSystemPrompt.trim() || undefined,
        model: cfgModel || undefined,
        retrievalK: Number(cfgRetrievalK),
        updatedAt: new Date().toISOString(),
      };

      setSelectedChannel(updated);
      setIsSaved(true);
      setChannels((prev) => {
        const list = prev.map((c) => (c.id === updated.id ? updated : c));
        localStorage.setItem("csa_configured_channels", JSON.stringify(list));
        return list;
      });

       fetch("/api/channel/list", {
         method: "POST",
         headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "save", channel: updated }),
      }).catch((err) => console.error("Error saving channel config to server:", err));
    } else {
      setIsSaved(true);
    }
  };

  // Handle Send Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastRecipients.trim() || !broadcastMessage.trim() || broadcastSending) return;

    setBroadcastSending(true);
    setBroadcastResult(null);
    setErrorMsg(null);

    const recipientsList = broadcastRecipients
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (recipientsList.length === 0) {
      setErrorMsg("Please enter at least one valid recipient phone number / JID.");
      setBroadcastSending(false);
      return;
    }

    try {
      const res = await fetch("/api/channel/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast",
          recipients: recipientsList,
          message: broadcastMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Broadcast failed");

      setBroadcastResult(`Broadcast sent successfully to ${data.sentCount} recipient(s)!`);
      setBroadcastMessage("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Broadcast failed to send");
    } finally {
      setBroadcastSending(false);
    }
  };

  // Add Channel Submit Handler
  const handleAddChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddChannelError(null);
    const trimmedName = newChannelName.trim();
    if (!trimmedName) return;

    const isDuplicate = channels.some(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setAddChannelError(`A channel named "${trimmedName}" already exists. Please enter a unique name.`);
      return;
    }

    const now = new Date().toISOString();
    const newChan: ChannelItem = {
      id: `channel-${Date.now()}`,
      name: trimmedName,
      type: newChannelType,
      description: newChannelDesc.trim() || undefined,
      autoReplyEnabled: newChannelAutoReply,
      model: newChannelModel || undefined,
      messageRateLimit: 5,
      maxTokens: 500,
      timeoutSeconds: 30,
      typingDelayMs: 1000,
      createdAt: now,
      updatedAt: now,
    };

    setChannels((prev) => {
      const updated = [...prev, newChan];
      try {
        localStorage.setItem("csa_configured_channels", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving channels to localStorage:", e);
      }
      return updated;
    });

    fetch("/api/channel/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", channel: newChan }),
    }).catch((e) => console.error("Error persisting new channel to server:", e));

    dispatchUi({ type: "RESET_NEW_CHANNEL_FORM" });
  };

  // Delete Channel Handler
  const handleDeleteChannel = (id: string) => {
    setChannels((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem("csa_configured_channels", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving channels to localStorage:", e);
      }
      return updated;
    });

    fetch("/api/channel/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", channelId: id }),
    }).catch((e) => console.error("Error deleting channel from server:", e));

    if (selectedChannel?.id === id) {
      setSelectedChannel(null);
    }
    setShowDeleteModal(null);
  };

  if (!user || (user.role !== "ADMIN" && user.role !== "CS_AGENT")) {
    return (
      <div style={{ padding: "32px", fontFamily: "var(--font-body)", color: "#a4262c", fontWeight: "bold" }}>
        UNAUTHORIZED ACCESS. ADMIN OR AGENT REQUIRED.
      </div>
    );
  }

  const isWaConnected = waStatus?.status === "CONNECTED";

  // Scenario B: Selected Channel Configuration With Tabs
  if (selectedChannel) {
    const isWa = selectedChannel.type === "WHATSAPP";
    const isTg = selectedChannel.type === "TELEGRAM";
    const currentChanWaStatus = waStatusesMap[selectedChannel.id] || waStatus;
    const currentChanTgStatus = telegramStatusesMap[selectedChannel.id] || tgStatus;

    const isChannelConnected = isWa
      ? Boolean(
          currentChanWaStatus?.status === "CONNECTED" ||
            (selectedChannel.boundPhone && waStatus?.status === "CONNECTED" && selectedChannel.boundPhone === waStatus?.userInfo?.phone)
        )
      : isTg
      ? currentChanTgStatus?.status === "CONNECTED"
      : false;

    const isWaQR = isWa && currentChanWaStatus?.status === "QR_READY";
    const isWaConnecting = isWa && currentChanWaStatus?.status === "CONNECTING";
    const statusText = isChannelConnected ? "Connected" : "Disconnected";

    return (
      <div
        className="dashboard-responsive-page"
        style={{
          minHeight: "100%",
          backgroundColor: "#faf9f8",
          padding: "28px 40px 60px 40px",
          boxSizing: "border-box",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#323130",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header with Breadcrumb Navigation */}
          <header>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#323130",
                margin: 0,
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span
                onClick={() => setSelectedChannel(null)}
                style={{
                  cursor: "pointer",
                  color: "#742774",
                  transition: "color 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="Back to Channels list"
              >
                <ArrowLeft style={{ width: "16px", height: "16px" }} />
                Channel
              </span>
              <span style={{ color: "#8a8886", fontWeight: "400" }}>/</span>
              <span>{selectedChannel.name}</span>
            </h1>
            <p style={{ fontSize: "13px", color: "#605e5c", marginTop: "4px" }}>
              Manage channel configuration, AI model settings, and automated reply parameters.
            </p>
          </header>

          {/* Top Navigation Tabs */}
          <div className="dashboard-scroll-tabs" style={{ display: "flex", borderBottom: "1px solid #e1dfdd", gap: "24px" }}>
            {[
              { id: "overview", label: "Overview", icon: BookOpen },
              { id: "connection", label: "Connection", icon: Wifi },
              { id: "message", label: "Message & Limits", icon: Sliders },
              { id: "bot", label: "AI Bot & Persona", icon: Bot },
              { id: "broadcast", label: "Broadcast", icon: Megaphone },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = detailTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  onClick={() => {
                    setDetailTab(tab.id as any);
                    if (selectedChannel) resetFormValues(selectedChannel);
                    if (tab.id !== "connection" && !isWaConnected) {
                      setShowPairingQR(false);
                    }
                  }}
                   style={{
                     flexShrink: 0,
                     whiteSpace: "nowrap",
                    borderBottom: isActive ? "2px solid #742774" : "2px solid transparent",
                    color: isActive ? "#742774" : "#605e5c",
                    fontWeight: isActive ? "600" : "400",
                    borderRadius: 0,
                  }}
                >
                  <IconComp style={{ width: "16px", height: "16px" }} />
                  <span>{tab.label}</span>
                </Button>
              );
            })}
          </div>

          {errorMsg && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#b91c1c",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <AlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {detailTab === "overview" && (
            <ChannelOverviewTab
              selectedChannel={selectedChannel}
              isWa={isWa}
              isChannelConnected={isChannelConnected}
              statusText={statusText}
              waStatus={waStatus}
              isWaQR={isWaQR}
              isWaConnecting={isWaConnecting}
            />
          )}

          {/* TAB 2: CONNECTION */}
          {detailTab === "connection" && (
            <ConnectionTab
              selectedChannel={selectedChannel}
              cfgName={cfgName}
              setCfgName={setCfgName}
              cfgDesc={cfgDesc}
              setCfgDesc={setCfgDesc}
              cfgTgToken={cfgTgToken}
              setCfgTgToken={setCfgTgToken}
              isWa={isWa}
              isChannelConnected={isChannelConnected}
              statusText={statusText}
              hasUnsavedConnectionChanges={hasUnsavedConnectionChanges}
              isSaved={isSaved}
              resetSuccessMsg={resetSuccessMsg}
              resettingConversations={resettingConversations}
              onOpenResetConfirm={() => setShowResetConfirmModal(true)}
              onSaveAllConfig={handleSaveAllConfig}
              actionLoading={actionLoading}
              isWaConnecting={isWaConnecting}
              isWaQR={isWaQR}
              showPairingQR={showPairingQR}
              setShowPairingQR={setShowPairingQR}
              setActiveQrUrl={setActiveQrUrl}
              setQrExpired={setQrExpired}
              setQrTimer={setQrTimer}
              qrExpired={qrExpired}
              qrTimer={qrTimer}
              waStatus={waStatus}
              handleWaAction={handleWaAction}
              tgStatus={tgStatus}
              telegramStatusesMap={telegramStatusesMap}
              tgActionLoading={tgActionLoading}
              setTgActionLoading={setTgActionLoading}
              setTgStatus={setTgStatus}
              setTelegramStatusesMap={setTelegramStatusesMap}
              setErrorMsg={setErrorMsg}
              setSuccessMsg={setSuccessMsg}
              cfgAutoReply={cfgAutoReply}
              cfgSystemPrompt={cfgSystemPrompt}
              cfgModel={cfgModel}
              cfgTimeout={cfgTimeout}
              cfgSessionTimeout={cfgSessionTimeout}
            />
          )}

          {/* TAB 3: MESSAGE & LIMITS */}
          {detailTab === "message" && (
            <MessageLimitsTab
              selectedChannel={selectedChannel}
              onSaveAllConfig={handleSaveAllConfig}
              hasUnsavedMessageChanges={hasUnsavedMessageChanges}
              isSaved={isSaved}
              cfgRateLimit={cfgRateLimit}
              setCfgRateLimit={setCfgRateLimit}
              cfgMaxTokens={cfgMaxTokens}
              setCfgMaxTokens={setCfgMaxTokens}
              cfgTimeout={cfgTimeout}
              setCfgTimeout={setCfgTimeout}
              cfgSessionTimeout={cfgSessionTimeout}
              setCfgSessionTimeout={setCfgSessionTimeout}
              cfgTypingDelay={cfgTypingDelay}
              setCfgTypingDelay={setCfgTypingDelay}
              cfgReplyMode={cfgReplyMode}
              setCfgReplyMode={setCfgReplyMode}
              cfgAllowPrivate={cfgAllowPrivate}
              setCfgAllowPrivate={setCfgAllowPrivate}
              cfgAllowGroup={cfgAllowGroup}
              setCfgAllowGroup={setCfgAllowGroup}
              cfgCommandPrefix={cfgCommandPrefix}
              setCfgCommandPrefix={setCfgCommandPrefix}
              cfgWhitelistList={cfgWhitelistList}
              setCfgWhitelistList={setCfgWhitelistList}
              cfgBlacklistList={cfgBlacklistList}
              setCfgBlacklistList={setCfgBlacklistList}
              editingWhitelistIdx={editingWhitelistIdx}
              setEditingWhitelistIdx={setEditingWhitelistIdx}
              editingBlacklistIdx={editingBlacklistIdx}
              setEditingBlacklistIdx={setEditingBlacklistIdx}
              channelCountryCode={channelCountryCode}
              setChannelCountryCode={setChannelCountryCode}
              waGroups={waGroups}
              loadingWaGroups={loadingWaGroups}
              showGroupPicker={showGroupPicker}
              setShowGroupPicker={setShowGroupPicker}
              showBlGroupPicker={showBlGroupPicker}
              setShowBlGroupPicker={setShowBlGroupPicker}
              fetchWaGroups={fetchWaGroups}
              getRecipientDisplayInfo={getRecipientDisplayInfo}
            />
          )}

          {/* TAB 4: AI BOT & PERSONA */}
          {detailTab === "bot" && (
            <AiBotTab
              onSaveAllConfig={handleSaveAllConfig}
              hasUnsavedBotChanges={hasUnsavedBotChanges}
              isSaved={isSaved}
              cfgAutoReply={cfgAutoReply}
              setCfgAutoReply={setCfgAutoReply}
              cfgModel={cfgModel}
              setCfgModel={setCfgModel}
              defaultModelName={defaultModelName}
              configuredModelsList={configuredModelsList}
              cfgRetrievalK={cfgRetrievalK}
              setCfgRetrievalK={setCfgRetrievalK}
              cfgSystemPrompt={cfgSystemPrompt}
              setCfgSystemPrompt={setCfgSystemPrompt}
            />
          )}

          {/* TAB 5: BROADCAST */}
          {detailTab === "broadcast" && (
            <BroadcastTab
              selectedChannel={selectedChannel}
              broadcastRecipients={broadcastRecipients}
              setBroadcastRecipients={setBroadcastRecipients}
              broadcastMessage={broadcastMessage}
              setBroadcastMessage={setBroadcastMessage}
              broadcastSending={broadcastSending}
              broadcastResult={broadcastResult}
              isWaConnected={isWaConnected}
              onSendBroadcast={handleSendBroadcast}
            />
          )}

          {/* Reset Confirmation Warning Modal */}
          <ResetConversationsModal
            isOpen={showResetConfirmModal}
            onClose={() => setShowResetConfirmModal(false)}
            onConfirm={handleResetConversations}
            loading={resettingConversations}
          />
        </div>
      </div>
    );
  }

  // Scenario A: Channel Directory Grid
  return (
    <>
      <ChannelList
        channels={channels}
        selectedChannel={selectedChannel}
        waStatus={waStatus}
        tgStatus={tgStatus}
        waStatusesMap={waStatusesMap}
        telegramStatusesMap={telegramStatusesMap}
        configuredModelsList={configuredModelsList}
        defaultModelName={defaultModelName}
        errorMsg={errorMsg}
        onSelectChannel={(chan, tab = "overview") => {
          setSelectedChannel(chan);
          setDetailTab(tab);
        }}
        onOpenAddModal={() => {
          setAddChannelError(null);
          setShowAddModal(true);
        }}
        onOpenDeleteModal={(chan) => setShowDeleteModal(chan)}
      />

      <AddChannelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddChannelSubmit}
        error={addChannelError}
        channelType={newChannelType}
        setChannelType={setNewChannelType}
        channelName={newChannelName}
        setChannelName={setNewChannelName}
        channelDesc={newChannelDesc}
        setChannelDesc={setNewChannelDesc}
        channelModel={newChannelModel}
        setChannelModel={setNewChannelModel}
        defaultModelName={defaultModelName}
        configuredModelsList={configuredModelsList}
      />

      <DeleteChannelModal
        channel={showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={handleDeleteChannel}
      />
    </>
  );
}
