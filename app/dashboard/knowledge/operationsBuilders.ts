export interface CollectionMin {
  id: string;
  name: string;
}

export interface CreateCollectionInput {
  token: string | null;
  colName: string;
  colDesc: string;
  colEmbeddingModel: string;
  colParserModel: string;
}

export function validateCollectionInput(params: {
  colName: string;
  collections: CollectionMin[];
  selectedEmbModel: string;
  availableEmbeddingModels: string[];
}): string | null {
  const trimmed = params.colName.trim();
  if (!trimmed) {
    return "Please fill out required fields (Collection Name).";
  }
  const isDuplicate = params.collections.some(
    (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (isDuplicate) {
    return `A collection named "${trimmed}" already exists. Please enter a unique name.`;
  }
  if (!params.selectedEmbModel || params.availableEmbeddingModels.length === 0) {
    return "Cannot create collection: Please configure an Embedding Provider in Dashboard > Providers first.";
  }
  return null;
}

export function buildCreateCollectionRequest(input: CreateCollectionInput) {
  return {
    url: "/api/knowledge/collections",
    method: "POST" as const,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({
      name: input.colName.trim(),
      description: input.colDesc.trim(),
      embedding_model: input.colEmbeddingModel,
      parser_model: input.colParserModel || "LlamaCloud",
    }),
  };
}

export function buildUpdateCollectionRequest(params: {
  token: string | null;
  colId: string;
  colName: string;
  colDesc: string;
}) {
  return {
    url: `/api/knowledge/collections/${params.colId}`,
    method: "PUT" as const,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      name: params.colName,
      description: params.colDesc,
    }),
  };
}

export function buildDeleteCollectionRequest(params: {
  token: string | null;
  colId: string;
}) {
  return {
    url: `/api/knowledge/collections/${params.colId}`,
    method: "DELETE" as const,
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
  };
}

export function buildSaveSettingsRequest(params: {
  token: string | null;
  targetColId?: string;
  llamaKeyInput: string;
  chunkSizeInput: number | string;
  chunkOverlapInput: number | string;
  embeddingModelInput: string;
  retrievalKInput: number | string;
  activeCollectionId?: string;
}) {
  return {
    url: params.targetColId
      ? `/api/knowledge/settings?collection_id=${params.targetColId}`
      : "/api/knowledge/settings",
    method: "PUT" as const,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      collection_id: params.targetColId,
      llama_cloud_api_key: params.llamaKeyInput,
      chunk_size: Number(params.chunkSizeInput),
      chunk_overlap: Number(params.chunkOverlapInput),
      embedding_model: params.embeddingModelInput,
      retrieval_k: Number(params.retrievalKInput),
      active_collection_id: params.activeCollectionId,
    }),
  };
}

export function buildSetActiveCollectionRequest(params: {
  token: string | null;
  newActive: string[];
}) {
  return {
    url: "/api/knowledge/settings",
    method: "PUT" as const,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      active_collection_ids: params.newActive,
      active_collection_id: params.newActive.join(","),
    }),
  };
}

export function buildUploadDocumentFormData(params: {
  token: string | null;
  collectionId: string;
  file: File | Blob;
  convertToMd: boolean;
  saveParserOutput: boolean;
  uploadChunkSize: number;
  uploadChunkOverlap: number;
}) {
  const fileName = "name" in params.file ? params.file.name : "document";
  const isSelectedFileMd =
    fileName.toLowerCase().endsWith(".md") ||
    fileName.toLowerCase().endsWith(".markdown") ||
    fileName.toLowerCase().endsWith(".txt");

  const formData = new FormData();
  formData.append("collection_id", params.collectionId);
  formData.append("title", fileName);
  formData.append("document_type", "POLICY");
  formData.append("convert_to_md", (isSelectedFileMd || params.convertToMd).toString());
  formData.append("save_parser_output", params.saveParserOutput.toString());
  formData.append("chunk_size", params.uploadChunkSize.toString());
  formData.append("chunk_overlap", params.uploadChunkOverlap.toString());
  formData.append("file", params.file);

  return {
    url: "/api/knowledge/documents/upload",
    method: "POST" as const,
    headers: { Authorization: `Bearer ${params.token}` },
    formData,
  };
}

export function buildCancelIngestionRequest(params: { token: string | null; docId: string }) {
  return {
    url: `/api/knowledge/documents/${params.docId}/cancel`,
    method: "POST" as const,
    headers: { Authorization: `Bearer ${params.token}` },
  };
}

export function buildIngestDocumentRequest(params: {
  token: string | null;
  docId: string;
  signal?: AbortSignal;
}) {
  return {
    url: `/api/knowledge/documents/${params.docId}/ingest`,
    method: "POST" as const,
    headers: { Authorization: `Bearer ${params.token}` },
    signal: params.signal,
  };
}

export function buildDocumentDownloadRequest(params: { token: string | null; docId: string }) {
  return {
    url: `/api/knowledge/documents/${params.docId}/download`,
    headers: { Authorization: `Bearer ${params.token}` },
  };
}

export function buildDocumentChunksRequest(params: { token: string | null; docId: string }) {
  return {
    url: `/api/knowledge/documents/${params.docId}/chunks`,
    headers: { Authorization: `Bearer ${params.token}` },
  };
}

export function buildDeleteChunkRequest(params: {
  token: string | null;
  docId: string;
  chunkId: string;
}) {
  return {
    url: `/api/knowledge/documents/${params.docId}/chunks/${params.chunkId}`,
    method: "DELETE" as const,
    headers: { Authorization: `Bearer ${params.token}` },
  };
}

export function buildDeleteDocumentRequest(params: { token: string | null; docId: string }) {
  return {
    url: `/api/knowledge/documents/${params.docId}`,
    method: "DELETE" as const,
    headers: { Authorization: `Bearer ${params.token}` },
  };
}

export function buildTestRetrievalRequest(params: {
  token: string | null;
  colId: string;
  query: string;
  topK: number | string;
}) {
  return {
    url: `/api/knowledge/collections/${params.colId}/retrieval`,
    method: "POST" as const,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({ query: params.query, top_k: Number(params.topK) }),
  };
}
