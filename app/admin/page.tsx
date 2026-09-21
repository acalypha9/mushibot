"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <p style={{ padding: "20px", fontFamily: "var(--font-mono)", fontSize: "var(--text-small)" }}>
      Redirecting to dashboard...
    </p>
  );
}
