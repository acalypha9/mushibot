"use client";

import React from "react";
import { createPortal } from "react-dom";

/**
 * Shared Portal component.
 * Renders children into `document.body` via React portal after client-side mount.
 */
export default function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
