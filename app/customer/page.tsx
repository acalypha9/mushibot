"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/chat");
  }, [router]);

  return (
    <p style={{ padding: "20px", fontFamily: "var(--font-mono)", fontSize: "var(--text-small)" }}>
      Redirecting to chat...
    </p>
  );
}
