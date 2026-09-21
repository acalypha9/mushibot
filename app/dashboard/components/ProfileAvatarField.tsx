"use client";

import { Input } from "@/components/ui/Input";

interface ProfileAvatarFieldProps {
  avatarUrl: string;
  userInitials: string;
  onAvatarChange: (newAvatarUrl: string) => void;
}

export default function ProfileAvatarField({
  avatarUrl,
  userInitials,
  onAvatarChange,
}: ProfileAvatarFieldProps) {
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          onAvatarChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        background: "var(--muted)",
        padding: "12px 16px",
        borderRadius: "var(--radius-md, 8px)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "var(--primary)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "700",
          fontSize: "16px",
          overflow: "hidden",
          border: "2px solid var(--card)",
          boxShadow: "var(--shadow-sm)",
          flexShrink: 0,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          userInitials
        )}
      </div>
      <div>
        <label
          htmlFor="avatar-upload-input"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            backgroundColor: "var(--accent, #efe5ef)",
            color: "var(--primary, #742774)",
            borderRadius: "var(--radius-sm, 4px)",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          Change Photo
        </label>
        <Input
          id="avatar-upload-input"
          type="file"
          accept="image/*"
          onChange={handleAvatarFileChange}
          style={{ display: "none" }}
        />
        <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "4px" }}>
          PNG or JPG up to 5MB
        </div>
      </div>
    </div>
  );
}
