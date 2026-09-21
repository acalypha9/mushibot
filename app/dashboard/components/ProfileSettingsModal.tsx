"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Settings } from "lucide-react";
import type { User } from "../../auth";
import ProfileAvatarField from "./ProfileAvatarField";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  avatarUrl: string;
  onAvatarChange: (newAvatarUrl: string) => void;
}

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  user,
  avatarUrl,
  onAvatarChange,
}: ProfileSettingsModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) return;

      if (avatarUrl !== (user.avatar_url || "")) {
        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatar_url: avatarUrl }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Failed to update profile picture.");
        }
      }

      if (newPassword || currentPassword || confirmPassword) {
        if (!currentPassword) throw new Error("Please enter your current password.");
        if (newPassword !== confirmPassword) throw new Error("New password and confirm password do not match.");
        if (newPassword.length < 6) throw new Error("New password must be at least 6 characters.");

        const resPass = await fetch("/api/auth/change-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });

        if (!resPass.ok) {
          const errData = await resPass.json();
          throw new Error(errData.detail || "Failed to change password.");
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      setSettingsMessage({ type: "success", text: "Settings updated successfully!" });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred while saving.";
      setSettingsMessage({ type: "error", text: errorMsg });
    } finally {
      setSavingSettings(false);
    }
  };

  const userInitials = user.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    : "FS";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      icon={<Settings style={{ width: "20px", height: "20px", color: "var(--primary)" }} />}
      maxWidth="md"
    >
      {settingsMessage && (
        <div
          role="status"
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: settingsMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${settingsMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: settingsMessage.type === "success" ? "#15803d" : "#dc2626",
          }}
        >
          <span>{settingsMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <ProfileAvatarField
          avatarUrl={avatarUrl}
          userInitials={userInitials}
          onAvatarChange={onAvatarChange}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <div>
            <label htmlFor="profile-fullname" style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "4px" }}>
              Full Name
            </label>
            <Input id="profile-fullname" type="text" value={user.full_name || "Administrator"} disabled />
          </div>
          <div>
            <label htmlFor="profile-email" style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "4px" }}>
              Email Address
            </label>
            <Input id="profile-email" type="text" value={user.email || ""} disabled />
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "4px 0" }} />

        <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--foreground)" }}>
          Security & Password
        </div>

        <div>
          <label htmlFor="current-password" style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "4px" }}>
            Current Password
          </label>
          <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <div>
            <label htmlFor="new-password" style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "4px" }}>
              New Password
            </label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
          </div>
          <div>
            <label htmlFor="confirm-password" style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "4px" }}>
              Confirm Password
            </label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            borderTop: "none",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            marginTop: "8px",
          }}
        >
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
