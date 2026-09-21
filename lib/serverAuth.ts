import crypto from "node:crypto";
import type { NextRequest } from "next/server";

type AuthResult = { ok: true } | { ok: false; status: 401 | 403 | 500; error: string };

function decodeSegment(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as unknown;
}

export function requireAdminRequest(request: NextRequest): AuthResult {
  const internalSecret = process.env.INTERNAL_API_SECRET || process.env.INTERNAL_API_KEY;
  const suppliedInternal = request.headers.get("x-internal-secret");
  if (internalSecret && suppliedInternal) {
    const suppliedBuffer = Buffer.from(suppliedInternal);
    const expectedBuffer = Buffer.from(internalSecret);
    if (suppliedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
      return { ok: true };
    }
  }

  const authorization = request.headers.get("authorization");
  const secret = process.env.JWT_SECRET;
  if (!secret) return { ok: false, status: 500, error: "Server authentication is not configured" };
  if (!authorization?.startsWith("Bearer ")) return { ok: false, status: 401, error: "Authentication required" };

  const token = authorization.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, status: 401, error: "Invalid token" };
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const expectedSignature = crypto.createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  if (encodedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(encodedSignature), Buffer.from(expectedSignature))) {
    return { ok: false, status: 401, error: "Invalid token" };
  }

  try {
    const header = decodeSegment(encodedHeader) as { alg?: string };
    const payload = decodeSegment(encodedPayload) as { exp?: number; role?: string };
    if (header.alg !== "HS256" || typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
      return { ok: false, status: 401, error: "Invalid or expired token" };
    }
    if (payload.role !== "ADMIN") return { ok: false, status: 403, error: "Admin access required" };
    return { ok: true };
  } catch {
    return { ok: false, status: 401, error: "Invalid token" };
  }
}

export function authFailure(result: AuthResult): Response | null {
  return result.ok ? null : Response.json({ error: result.error }, { status: result.status });
}
