"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import Portal from "./Portal";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | string;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
  bodyStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "md",
  closeOnBackdropClick = true,
  showCloseButton = true,
  className,
  bodyStyle,
  containerStyle,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthMap: Record<string, string> = {
    sm: "400px",
    md: "480px",
    lg: "560px",
    xl: "640px",
    "2xl": "760px",
  };

  const calculatedMaxWidth = widthMap[maxWidth] || maxWidth;

  return (
    <Portal>
      <div
        className={`modal-backdrop ${className || ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "20px 16px",
          boxSizing: "border-box",
          overflowY: "auto",
          animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => {
          if (closeOnBackdropClick && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="modal-container"
          style={{
            margin: "auto",
            background: "var(--card)",
            borderRadius: "var(--radius-lg, 12px)",
            border: "1px solid var(--border)",
            width: "100%",
            maxWidth: calculatedMaxWidth,
            boxShadow: "var(--shadow-lg, 0 12px 24px -4px rgba(0, 0, 0, 0.15))",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxSizing: "border-box",
            maxHeight: "90vh",
            overflow: "hidden",
            fontFamily: "var(--font-body)",
            color: "var(--foreground)",
            animation: "modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            ...containerStyle,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div
              className="modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: subtitle ? "flex-start" : "center",
                gap: "12px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {title && (
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: "700",
                      fontSize: "1.15rem",
                      color: "var(--foreground)",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      lineHeight: "1.3",
                    }}
                  >
                    {icon && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--primary)",
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </span>
                    )}
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {title}
                    </span>
                  </h2>
                )}
                {subtitle && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--muted-foreground)",
                      marginTop: "4px",
                      lineHeight: "1.4",
                    }}
                  >
                    {subtitle}
                  </div>
                )}
              </div>

              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--muted-foreground)",
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: "var(--radius-sm, 4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--muted)";
                    e.currentTarget.style.color = "var(--foreground)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--muted-foreground)";
                  }}
                >
                  <X style={{ width: "18px", height: "18px" }} />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div
            className="modal-body"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              flex: 1,
              overflowY: "auto",
              paddingRight: "2px",
              ...bodyStyle,
            }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className="modal-footer"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "10px",
                marginTop: "4px",
                paddingTop: "14px",
                borderTop: "1px solid var(--border)",
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
