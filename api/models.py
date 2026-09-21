import uuid
import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer, JSON, func
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import UUID

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(Text, nullable=True)
    role = Column(String, nullable=False)  # 'ADMIN', 'CS_AGENT', 'CUSTOMER'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    status = Column(String, nullable=False)  # 'OPEN', 'RESOLVED'
    channel = Column(String, default="WEB", nullable=False)
    summary = Column(String, nullable=True)
    title = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    participant_phone = Column(String, nullable=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    model_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_type = Column(String, nullable=False)  # 'CUSTOMER', 'AI'
    content = Column(Text, nullable=False)
    metadata_json = Column("metadata", JSON, nullable=True)
    prompt_tokens = Column(Integer, default=0, nullable=True)
    completion_tokens = Column(Integer, default=0, nullable=True)
    reasoning_tokens = Column(Integer, default=0, nullable=True)
    total_tokens = Column(Integer, default=0, nullable=True)
    model_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class KnowledgeCollection(Base):
    __tablename__ = "langchain_pg_collection"

    id = Column("uuid", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False, index=True)
    cmetadata = Column(JSON, nullable=True)


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collection_id = Column(UUID(as_uuid=True), ForeignKey("langchain_pg_collection.uuid", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    document_type = Column(String, default="POLICY", nullable=False)  # 'POLICY', 'PROCEDURE', 'FAQ', 'MANUAL'
    source_type = Column(String, default="MANUAL_TEXT", nullable=False)  # 'MANUAL_TEXT', 'FILE_UPLOAD'
    content_text = Column(Text, nullable=True)
    markdown_text = Column(Text, nullable=True)
    file_size = Column(Integer, default=0, nullable=False)
    status = Column(String, default="DRAFT", nullable=False)  # 'DRAFT', 'ACTIVE', 'ARCHIVED'
    ingestion_status = Column(String, default="PENDING", nullable=False)  # 'PENDING', 'PARSING', 'CHUNKING', 'EMBEDDING', 'COMPLETED', 'FAILED'
    chunk_count = Column(Integer, default=0, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    cmetadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ModelProvider(Base):
    __tablename__ = "model_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String, nullable=False, index=True)  # 'chat', 'embedding', 'parser'
    provider_type = Column(String, nullable=False)  # 'openai', 'gemini', 'anthropic', 'deepseek', 'ollama', 'openrouter', 'azure', 'custom'
    name = Column(String, nullable=False)
    base_url = Column(String, nullable=True)
    api_key = Column(String, nullable=True)
    model_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    config = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class FunctionTool(Base):
    __tablename__ = "function_tools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    is_enabled = Column(Boolean, default=True, nullable=False)
    parameters_json = Column(String, nullable=True)  # JSON schema
    endpoint_url = Column(String, nullable=True)
    http_method = Column(String, default="POST", nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class McpServer(Base):
    __tablename__ = "mcp_servers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    transport = Column(String, nullable=False)  # 'STDIO', 'Streamable HTTP'
    endpoint_url = Column(String, nullable=True)
    is_enabled = Column(Boolean, default=True, nullable=False)
    env_json = Column(Text, nullable=True)
    tools = Column(JSON, nullable=True)  # List of dicts [{"name": "...", "description": "..."}]
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class CronReminder(Base):
    __tablename__ = "cron_reminders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    message = Column(Text, nullable=False)
    cron_expression = Column(String, nullable=False, default="0 9 * * 1-5")  # "0 9 * * 1-5"
    timezone = Column(String, nullable=False, default="Asia/Jakarta")
    channel_type = Column(String, nullable=False, default="WHATSAPP")  # 'WHATSAPP', 'TELEGRAM', 'WEB'
    channel_id = Column(String, nullable=False, default="default")
    target_recipients = Column(Text, nullable=True)  # Comma-separated phone numbers, JIDs, or chat IDs
    is_active = Column(Boolean, default=True, nullable=False)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    last_status = Column(String, nullable=True)  # 'SUCCESS', 'FAILED', 'PENDING'
    last_error = Column(Text, nullable=True)
    run_count = Column(Integer, default=0, nullable=False)
    cmetadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
