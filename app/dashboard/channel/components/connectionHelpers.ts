export interface ConnectionBadgeParams {
  isWa: boolean;
  isConnected: boolean;
}

export interface WhatsAppPairingParams {
  actionLoading: string | null;
  isWaConnecting: boolean;
  isWaQR: boolean;
  hasQrCode: boolean;
  qrExpired: boolean;
}

export function getConnectionStatusText(isConnected: boolean, statusText?: string | null): string {
  if (statusText && statusText.trim().length > 0) {
    return statusText;
  }
  return isConnected ? "Connected" : "Disconnected";
}

export function getConnectionBadgeStyle({ isWa, isConnected }: ConnectionBadgeParams) {
  if (isWa) {
    return {
      background: isConnected ? "#efe5ef" : "#ffffff",
      color: isConnected ? "#742774" : "#605e5c",
      border: "1px solid #e1dfdd",
    };
  }
  return {
    background: isConnected ? "#e0f2fe" : "var(--card)",
    color: isConnected ? "#0369a1" : "var(--muted-foreground)",
    border: "1px solid var(--border)",
  };
}

export function getWhatsAppPairingState({
  actionLoading,
  isWaConnecting,
  isWaQR,
  hasQrCode,
  qrExpired,
}: WhatsAppPairingParams) {
  const isInitializing = actionLoading === "connect" || isWaConnecting;
  const showQrImage = !isInitializing && isWaQR && hasQrCode && !qrExpired;
  const isExpired = !isInitializing && (!showQrImage || qrExpired);

  return {
    isInitializing,
    showQrImage,
    isExpired,
  };
}

export function getTelegramBotDisplay(
  mapStatus?: { botInfo?: { id?: number; username?: string; firstName?: string } | null } | null,
  directStatus?: { botInfo?: { id?: number; username?: string; firstName?: string } | null } | null
) {
  const username =
    mapStatus?.botInfo?.username || directStatus?.botInfo?.username || "Bot";
  const firstName =
    mapStatus?.botInfo?.firstName || directStatus?.botInfo?.firstName || "";

  return {
    username,
    firstName,
  };
}
