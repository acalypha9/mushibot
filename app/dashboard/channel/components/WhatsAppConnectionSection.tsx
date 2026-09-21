"use client";

import React from "react";
import Button from "@/components/ui/Button";
import { Smartphone, RefreshCw, QrCode, Power, Clock, AlertCircle } from "lucide-react";
import { WhatsAppStatus } from "../types";
import {
  getConnectionStatusText,
  getConnectionBadgeStyle,
  getWhatsAppPairingState,
} from "./connectionHelpers";

export interface WhatsAppConnectionSectionProps {
  isChannelConnected: boolean;
  statusText: string;
  actionLoading: string | null;
  isWaConnecting: boolean;
  isWaQR: boolean;
  showPairingQR: boolean;
  setShowPairingQR: (show: boolean) => void;
  setActiveQrUrl: (url: string | null) => void;
  setQrExpired: (expired: boolean) => void;
  setQrTimer: (timer: number | ((prev: number) => number)) => void;
  qrExpired: boolean;
  qrTimer: number;
  waStatus: WhatsAppStatus | null;
  handleWaAction: (
    action: "connect" | "disconnect" | "reset" | "toggle_autoreply",
    autoReplyVal?: boolean,
    systemPromptVal?: string,
    modelVal?: string
  ) => Promise<void>;
}

export const WhatsAppConnectionSection: React.FC<WhatsAppConnectionSectionProps> = ({
  isChannelConnected,
  statusText,
  actionLoading,
  isWaConnecting,
  isWaQR,
  showPairingQR,
  setShowPairingQR,
  setActiveQrUrl,
  setQrExpired,
  setQrTimer,
  qrExpired,
  qrTimer,
  waStatus,
  handleWaAction,
}) => {
  const displayStatus = getConnectionStatusText(isChannelConnected, statusText);
  const badgeStyle = getConnectionBadgeStyle({ isWa: true, isConnected: isChannelConnected });
  const pairingState = getWhatsAppPairingState({
    actionLoading,
    isWaConnecting,
    isWaQR,
    hasQrCode: Boolean(waStatus?.qrCodeDataUrl),
    qrExpired,
  });

  return (
    <div
      style={{
        background: "var(--muted)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "8px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "4px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Smartphone
            style={{
              width: "14px",
              height: "14px",
              color: isChannelConnected ? "var(--secondary)" : "var(--muted-foreground)",
            }}
          />
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted-foreground)" }}>
            WhatsApp Pairing Status:
          </span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: "8px",
              fontSize: "10px",
              fontWeight: "600",
              ...badgeStyle,
            }}
          >
            {displayStatus}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {!isChannelConnected ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleWaAction("connect")}
              disabled={actionLoading === "connect" || isWaConnecting}
            >
              {actionLoading === "connect" || isWaConnecting ? (
                <>
                  <RefreshCw style={{ width: "12px", height: "12px", animation: "spin 1s linear infinite" }} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <QrCode style={{ width: "12px", height: "12px" }} />
                  <span>Connect</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleWaAction("disconnect")}
              disabled={actionLoading === "disconnect"}
            >
              <Power style={{ width: "12px", height: "12px" }} />
              <span>Disconnect</span>
            </Button>
          )}
        </div>
      </div>

      {showPairingQR && !isChannelConnected && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            background: "var(--card)",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            width: "100%",
            minHeight: "180px",
          }}
        >
          {pairingState.isInitializing ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "16px 0", color: "var(--muted-foreground)" }}>
              <RefreshCw style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", color: "#742774" }} />
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>
                Initializing WhatsApp Session & Generating QR Code...
              </span>
            </div>
          ) : pairingState.showQrImage && waStatus?.qrCodeDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={waStatus.qrCodeDataUrl} alt="WhatsApp QR Code" style={{ width: "150px", height: "150px", display: "block" }} />
              <div style={{ fontSize: "12px", color: "var(--foreground)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <p style={{ margin: 0, fontWeight: "600" }}>Scan QR Code with WhatsApp</p>
                <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>WhatsApp &gt; Linked Devices &gt; Link a Device</span>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "rgba(245, 158, 11, 0.12)",
                    color: "#d97706",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "600",
                    marginTop: "4px",
                  }}
                >
                  <Clock style={{ width: "12px", height: "12px" }} />
                  <span>QR Code expires in {qrTimer}s</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "12px 0", textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#b91c1c", fontSize: "12px", fontWeight: "600" }}>
                <AlertCircle style={{ width: "16px", height: "16px" }} />
                <span>QR Code Expired</span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                The pairing code timed out. Generate a new code to pair.
              </span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowPairingQR(true);
                  setActiveQrUrl(null);
                  setQrExpired(false);
                  setQrTimer(60);
                  handleWaAction("connect");
                }}
              >
                <RefreshCw style={{ width: "12px", height: "12px" }} />
                <span>Refresh QR Code</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {isChannelConnected && waStatus?.userInfo?.phone && (
        <div style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: "600", fontFamily: "var(--font-mono)" }}>
          Linked Account Phone: {waStatus.userInfo.phone}
        </div>
      )}
    </div>
  );
};
