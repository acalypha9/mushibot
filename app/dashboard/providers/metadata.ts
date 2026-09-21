import type { ModelsDevEntry } from "./types";
export type { ModelsDevEntry };

export function parseToNumberString(val?: string | number): string {
  if (!val) return "0";
  const str = val.toString().trim().toUpperCase();
  if (str.endsWith("M")) {
    const n = parseFloat(str);
    return isNaN(n) ? "0" : `${Math.floor(n * 1000000)}`;
  }
  if (str.endsWith("K")) {
    const n = parseFloat(str);
    return isNaN(n) ? "0" : `${Math.floor(n * 1000)}`;
  }
  return str;
}

export function formatTokenCount(num?: number | string): string | undefined {
  if (!num) return undefined;
  const strVal = num.toString().trim().toUpperCase();
  if (strVal.endsWith("M") || strVal.endsWith("K")) {
    return strVal;
  }
  const val = parseFloat(strVal.replace(/,/g, ""));
  if (isNaN(val) || val <= 0) return undefined;
  if (val >= 1000000) return `${Math.floor(val / 1000000)}M`;
  if (val >= 1000) return `${Math.floor(val / 1000)}K`;
  return `${val}`;
}

export function cleanRawModelId(id: string) {
  if (!id) return "";
  let s = id.trim();
  let prev = "";
  while (s !== prev && s.includes("/")) {
    prev = s;
    const parts = s.split("/");
    const first = parts[0].toLowerCase();
    if (
      first.includes("openai") ||
      first.includes("gemini") ||
      first.includes("claude") ||
      first.includes("anthropic") ||
      first.includes("ollama") ||
      first.includes("huggingface") ||
      first.includes("deepseek") ||
      first.includes("provider") ||
      first.includes("models")
    ) {
      s = parts.slice(1).join("/");
    }
  }
  return s;
}

export const KNOWN_PROVIDERS = [
  "anthropic", "openai", "google", "meta", "mistral", "cohere",
  "xai", "deepseek", "nvidia", "microsoft", "xiaomi", "stepfun",
  "sarvam", "deepreinforce", "qwen", "zhipu", "minimax", "baichuan",
  "together", "perplexity", "groq", "fireworks", "amazon", "ai21"
];

export const PROVIDER_ALIAS_MAP: Record<string, string> = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
  gemini: "google",
  meta: "meta",
  llama: "meta",
  mistral: "mistral",
  cohere: "cohere",
  xai: "xai",
  grok: "xai",
  deepseek: "deepseek",
  nvidia: "nvidia",
  microsoft: "microsoft",
  xiaomi: "xiaomi",
  stepfun: "stepfun",
  sarvam: "sarvam",
  deepreinforce: "deepreinforce",
  qwen: "qwen"
};

export function isModelsDevEntry(val: unknown): val is ModelsDevEntry {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

export const metadataCache = new Map<string, ModelsDevEntry | null>();

export function resolveModelMetadata(
  modelId: string,
  map: Record<string, unknown> | null | undefined
): ModelsDevEntry | null {
  if (!modelId || !map) return null;
  const cacheKey = modelId.toLowerCase().trim();
  if (metadataCache.has(cacheKey)) {
    return metadataCache.get(cacheKey) ?? null;
  }

  const res = computeModelMetadata(modelId, map);
  metadataCache.set(cacheKey, res);
  return res;
}

export function computeModelMetadata(
  modelId: string,
  map: Record<string, unknown> | null | undefined
): ModelsDevEntry | null {
  if (!modelId || !map || Object.keys(map).length === 0) return null;
  const id = modelId.toLowerCase().trim();

  // 1. Direct match
  const direct = map[id];
  if (isModelsDevEntry(direct)) return direct;

  // 2. Key variations
  const variations = [
    id,
    id.replace(/\./g, "-"),
    id.replace(/-/g, "."),
    id.replace(/_/g, "-")
  ];
  for (const v of variations) {
    const varMatch = map[v];
    if (isModelsDevEntry(varMatch)) return varMatch;
  }

  // 3. Detect provider prefix
  let detectedProvider: string | null = null;
  let cleanId = id;

  if (id.includes("/")) {
    const parts = id.split("/");
    const prefix = parts[0];
    if (PROVIDER_ALIAS_MAP[prefix]) {
      detectedProvider = PROVIDER_ALIAS_MAP[prefix];
    }
    cleanId = parts.slice(1).join("/");
  } else {
    for (const pKey of Object.keys(PROVIDER_ALIAS_MAP)) {
      if (id.startsWith(pKey + "-")) {
        detectedProvider = PROVIDER_ALIAS_MAP[pKey];
        cleanId = id.slice(pKey.length + 1);
        break;
      }
    }
  }

  const candidates = [cleanId, id];
  if (detectedProvider) {
    candidates.push(`${detectedProvider}-${cleanId}`);
    candidates.push(`${detectedProvider}/${cleanId}`);
    candidates.push(`${detectedProvider}/${detectedProvider}-${cleanId}`);
  }

  const cleanVars: string[] = [];
  for (const c of candidates) {
    cleanVars.push(c, c.replace(/\./g, "-"), c.replace(/-/g, "."));
  }

  for (const cv of cleanVars) {
    const cvMatch = map[cv];
    if (isModelsDevEntry(cvMatch)) return cvMatch;
    if (detectedProvider) {
      const key = `${detectedProvider}/${cv}`;
      const prefMatch = map[key];
      if (isModelsDevEntry(prefMatch)) return prefMatch;
    }
  }

  // 4. Match entry model names
  for (const k of Object.keys(map)) {
    const entry = map[k];
    if (!isModelsDevEntry(entry)) continue;
    const kModel = k.includes("/") ? k.split("/").pop() || "" : k;
    const rawId = typeof entry.id === "string" ? entry.id : "";
    const entryId = rawId.includes("/") ? rawId.split("/").pop() || "" : rawId;

    for (const cv of cleanVars) {
      if (
        kModel.toLowerCase() === cv ||
        entryId.toLowerCase() === cv ||
        kModel.toLowerCase().replace(/\./g, "-") === cv.replace(/\./g, "-") ||
        entryId.toLowerCase().replace(/\./g, "-") === cv.replace(/\./g, "-")
      ) {
        return entry;
      }
    }
  }

  // 5. Normalized fuzzy match
  const normTarget = cleanId.replace(/[^a-z0-9]/g, "");
  if (normTarget.length >= 6) {
    let bestMatch: ModelsDevEntry | null = null;
    let bestScore = 0;

    for (const k of Object.keys(map)) {
      const entry = map[k];
      if (!isModelsDevEntry(entry)) continue;
      const kModel = k.includes("/") ? k.split("/").pop() || "" : k;
      const normK = kModel.replace(/[^a-z0-9]/g, "");

      if (normTarget === normK) return entry;

      if (normK.includes(normTarget) && normTarget.length / normK.length > 0.6) {
        if (normTarget.length > bestScore) {
          bestScore = normTarget.length;
          bestMatch = entry;
        }
      }
    }
    if (bestMatch) return bestMatch;
  }

  return null;
}
