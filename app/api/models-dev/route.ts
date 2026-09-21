import { NextResponse } from "next/server";

let cachedData: unknown = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    const now = Date.now();
    if (cachedData && now - lastFetchTime < CACHE_TTL_MS) {
      return NextResponse.json(cachedData);
    }

    const res = await fetch("https://models.dev/api.json", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      cache: "no-store"
    });

    if (!res.ok) {
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
      return NextResponse.json(
        { error: `Failed to fetch from models.dev: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data: unknown = await res.json();
    cachedData = data;
    lastFetchTime = now;

    return NextResponse.json(data);
  } catch (error: unknown) {
    if (cachedData) {
      return NextResponse.json(cachedData);
    }
    console.error("Error proxying models.dev api.json:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
