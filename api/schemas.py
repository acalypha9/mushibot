# noqa: SIZE_OK - Pure Pydantic DTO schema declarations for API requests and responses
import uuid
import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


# --- Auth ---

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str

class RegisterCustomerRequest(BaseModel):
    email: str
    password: str
    full_name: str


# --- Users ---

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    avatar_url: Optional[str] = None

class UserListResponse(BaseModel):
    items: List[UserResponse]
    total: int
    limit: int
    offset: int

class CreateUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str

class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None


# --- Chat ---

class CreateConversationRequest(BaseModel):
    channel: str = "WEB"
    model_name: Optional[str] = None

class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_type: str
    content: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    participant_phone: Optional[str] = None
    status: str
    channel: str
    summary: Optional[str] = None
    title: Optional[str] = None
    is_pinned: bool = False
    model_name: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)

class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    is_pinned: Optional[bool] = None
    status: Optional[str] = None
    model_name: Optional[str] = None

class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]
    total: int
    limit: int
    offset: int

class SendMessageRequest(BaseModel):
    content: str
    edit_message_id: Optional[str] = None
    model: Optional[str] = None
    provider_id: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    content: str


# --- Model Providers ---

class ModelProviderCreate(BaseModel):
    category: str = Field(..., description="'chat', 'embedding', or 'parser'")
    provider_type: str = Field(..., description="Provider type identifier such as 'openai', 'gemini', 'anthropic', 'deepseek', 'ollama', 'openrouter', 'azure', 'custom'")
    name: str
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: str
    is_active: bool = True
    is_default: bool = False
    config: Optional[Dict[str, Any]] = None

class ModelProviderUpdate(BaseModel):
    name: Optional[str] = None
    provider_type: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None

class ModelProviderResponse(BaseModel):
    id: uuid.UUID
    category: str
    provider_type: str
    name: str
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    masked_api_key: Optional[str] = None
    has_api_key: bool = False
    model_name: str
    is_active: bool
    is_default: bool
    config: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class TestProviderRequest(BaseModel):
    category: Optional[str] = "chat"
    provider_type: Optional[str] = "openai"
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class FetchModelsRequest(BaseModel):
    provider_id: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    provider_type: Optional[str] = "openai"
    proxy: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class FunctionToolCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_enabled: bool = True
    parameters_json: Optional[str] = None
    endpoint_url: Optional[str] = None
    http_method: Optional[str] = "POST"


class FunctionToolUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_enabled: Optional[bool] = None
    parameters_json: Optional[str] = None
    endpoint_url: Optional[str] = None
    http_method: Optional[str] = None


class FunctionToolResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    is_enabled: bool
    parameters_json: Optional[str] = None
    endpoint_url: Optional[str] = None
    http_method: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class CronReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    message: str
    cron_expression: str = "0 9 * * 1-5"
    timezone: str = "Asia/Jakarta"
    channel_type: str = "WHATSAPP"
    channel_id: str = "default"
    target_recipients: Optional[str] = None
    is_active: bool = True
    cmetadata: Optional[Dict[str, Any]] = None


class CronReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    message: Optional[str] = None
    cron_expression: Optional[str] = None
    timezone: Optional[str] = None
    channel_type: Optional[str] = None
    channel_id: Optional[str] = None
    target_recipients: Optional[str] = None
    is_active: Optional[bool] = None
    cmetadata: Optional[Dict[str, Any]] = None


class CronReminderResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    message: str
    cron_expression: str
    timezone: str
    channel_type: str
    channel_id: str
    target_recipients: Optional[str] = None
    is_active: bool
    last_run_at: Optional[datetime.datetime] = None
    next_run_at: Optional[datetime.datetime] = None
    last_status: Optional[str] = None
    last_error: Optional[str] = None
    run_count: int
    cmetadata: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class CronReminderTriggerResponse(BaseModel):
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None


# --- Knowledge Base & Document Schemas ---

class CollectionCreate(BaseModel):
    name: str
    description: str = ""
    embedding_model: Optional[str] = None
    parser_model: Optional[str] = "LlamaCloud"

class CollectionResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    document_count: int = 0
    chunk_count: int = 0
    chunk_size: int = 1024
    chunk_overlap: int = 50
    embedding_model: str = "BAAI/bge-m3"
    embedding_dimension: Optional[int] = None
    llama_cloud_api_key: str = ""
    created_at: str = ""
    updated_at: str = ""

class SettingsResponse(BaseModel):
    llama_cloud_api_key: str = ""
    chunk_size: int = 1024
    chunk_overlap: int = 50
    embedding_model: str = "BAAI/bge-m3"
    active_collection_id: Optional[str] = None
    active_collection_ids: Optional[List[str]] = []
    retrieval_k: int = 3

class SettingsUpdate(BaseModel):
    collection_id: Optional[str] = None
    llama_cloud_api_key: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    embedding_model: Optional[str] = None
    active_collection_id: Optional[str] = None
    active_collection_ids: Optional[List[str]] = None
    retrieval_k: Optional[int] = None

class ManualDocumentCreate(BaseModel):
    collection_id: str
    title: str
    document_type: str = "POLICY"
    content_text: str

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class RetrievalRequest(BaseModel):
    query: str
    top_k: int = 4

class DocumentResponse(BaseModel):
    id: str
    collection_id: str
    title: str
    document_type: str
    source_type: str
    file_size: int = 0
    status: str
    ingestion_status: str
    chunk_count: int
    version: int
    created_at: str
    updated_at: str = ""
    convert_to_md: bool = False
    save_parser_output: bool = False


# --- Channel & MCP Schemas ---

class ChannelQueryRequest(BaseModel):
    message: str
    channel: str = "WHATSAPP"
    channel_id: Optional[str] = None
    sender_id: Optional[str] = None
    remote_jid: Optional[str] = None
    push_name: Optional[str] = None
    participant_phone: Optional[str] = None
    session_timeout: int = 300
    response_timeout: Optional[float] = None
    system_prompt: Optional[str] = None
    model: Optional[str] = None

class McpServerCreate(BaseModel):
    name: str
    transport: str = "STDIO"
    endpoint_url: Optional[str] = None
    env_json: Optional[str] = None
    is_enabled: bool = True

class McpServerUpdate(BaseModel):
    name: Optional[str] = None
    transport: Optional[str] = None
    endpoint_url: Optional[str] = None
    env_json: Optional[str] = None
    is_enabled: Optional[bool] = None

class McpServerResponse(BaseModel):
    id: uuid.UUID
    name: str
    transport: str
    endpoint_url: Optional[str] = None
    is_enabled: bool
    env_json: Optional[str] = None
    tools: Optional[Any] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

