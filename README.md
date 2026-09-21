# Mushibot Agent

An enterprise-ready, omnichannel AI customer support platform powered by **Next.js**, **FastAPI**, and **PostgreSQL (pgvector)**. Features intelligent RAG document retrieval, Model Context Protocol (MCP) integration, dynamic function calling, automated scheduled reminders, and native **WhatsApp** & **Telegram** channel gateways.

---

## What is this?

This platform is a complete, self-hosted AI customer support operating system designed to automate customer interactions across multiple channels while giving human agents complete oversight, advanced knowledge base retrieval, and dynamic AI tool orchestration.

```mermaid
graph LR
    subgraph Channels["Omnichannel Gateways"]
        WA["WhatsApp (Baileys)"]
        TG["Telegram (Grammy)"]
        WB["Webchat Widget"]
    end

    subgraph App["Next.js Web Frontend"]
        DASH["Dashboard & Live Chat"]
        KB["Knowledge Base (RAG)"]
        TOOLS["Tools & Reminders"]
        PROV["Model Providers"]
    end

    subgraph Backend["FastAPI AI Engine"]
        ROUTER["Agent Router & LangChain"]
        MCP["MCP Server Client"]
        REMIND["Cron Scheduler"]
        RAG["Vector Retriever"]
    end

    subgraph Storage["PostgreSQL + pgvector"]
        DB[(Chat History & Reminders)]
        VEC[(Document Chunks & Embeddings)]
    end

    Channels <--> DASH
    DASH <--> Backend
    Backend <--> Storage
    Backend <--> EXT["LLM Providers (OpenAI, Claude, Ollama, Gemini)"]
```

---

## Why This Platform?

Traditional customer support bots are rigid, difficult to customize, and siloed into single channels. This platform bridges modern LLM intelligence with real-world business workflows:

- **Seamless Omnichannel Routing**: Connect multiple WhatsApp and Telegram accounts simultaneously. Customers can chat from their preferred messenger while agents manage conversations from a unified inbox.
- **Enterprise-Grade RAG**: Upload documents (PDF, DOCX, TXT, CSV, Markdown) and automatically partition, embed, and query them with hybrid search and vector similarity powered by `pgvector`.
- **Extensible AI Tooling**: Equip your AI assistants with native Python function tools or connect external Model Context Protocol (**MCP**) servers via stdio or SSE.
- **Automated Proactive Reminders**: Schedule cron-based notifications, follow-ups, or announcements with dynamic variable placeholders, randomized active time windows, and channel broadcasting.
- **Human-in-the-Loop Handover**: Monitor live chats in real time, take over bot conversations seamlessly, and manage agent permissions with role-based access control.

---

## Core Features

### 1. Omnichannel Gateway & Live Chat
- **WhatsApp Web Integration**: Direct pairing via QR code or pairing code using `@whiskeysockets/baileys`. Supports multiple numbers/sessions.
- **Telegram Bot Support**: Webhook-ready bot integration using `grammy`.
- **Real-Time Live Chat Inbox**: Live message streaming, agent takeover mode, canned responses, customer contact cards, and conversation status tracking (Open, Active, Resolved).
- **Group & Private Filtering**: Target private chats, group conversations, or broadcast to all contacts with exclusion blacklists.

### 2. Knowledge Base & RAG Pipeline
- **pgvector Vector Database**: Native PostgreSQL vector search for high-speed semantic retrieval.
- **Multi-Format Ingestion**: Upload PDF, Markdown, Plain Text, DOCX, CSV, and JSON files.
- **Chunk Inspector & Customization**: Configure chunk size, overlap, chunking strategies, and inspect generated chunks directly from the dashboard.
- **Multi-Collection Isolation**: Partition knowledge bases by department, product, or topic.
- **Retrieval Playground**: Test search queries, preview similarity scores, and tune top-k parameters in real time.

### 3. Model Providers & Orchestration
- **Supported Providers**: OpenAI, Anthropic Claude, Ollama (Local LLMs), Google Gemini, OpenRouter, Groq, DeepSeek, and custom OpenAI-compatible endpoints.
- **Model Configuration**: Adjust system prompts, temperature, top-p, context window limits, and fallback model routing.
- **Embedding Models**: Configure custom embedding models.

### 4. Function Tools & Model Context Protocol (MCP)
- **Built-in Tools**: Order tracking, booking lookup, appointment scheduler, knowledge retrieval, and custom API webhooks.
- **MCP Protocol Support**: Plug in external MCP servers over stdio or SSE to give the AI access to database queries, GitHub, file systems, and external APIs.
- **Schema Inspector**: View JSON schemas, inspect parameters, and toggle individual tools on or off with a single click.

### 5. Scheduled Reminders & Broadcaster
- **Flexible Schedules**: One-time reminders, daily, weekly, monthly, or interval-based execution.
- **Randomized Window Schedules**: Execute tasks at random intervals within an active time window to mimic natural messaging patterns.
- **Dynamic Variables**: Personalize messages using variable placeholders (`{{customer_name}}`, `{{due_date}}`, etc.).
- **Manual Test Dispatch**: Preview and test reminder dispatches before enabling schedules.

### 6. Administration & Personnel
- **Role-Based Access Control (RBAC)**: Admin and Support Agent roles with JWT-based authentication.
- **Security & Privacy**: Encrypted token storage, automatic token expiration enforcement, and sanitized audit logs.

---

## Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend Framework** | Next.js 15 / React 19 | Modern App Router, TypeScript, server and client components |
| **Styling & Icons** | CSS Design Tokens / Lucide Icons | Premium, responsive dashboard design system |
| **Backend API** | FastAPI / Python 3.11+ | Asynchronous REST API, LangChain agent loop, MCP client |
| **Database & Vector Store** | PostgreSQL 16 + `pgvector` | Relational tables and high-performance vector embeddings |
| **Messaging Engines** | Baileys / Grammy | WhatsApp multi-device client and Telegram Bot API |
| **Containerization** | Docker & Docker Compose | Multi-stage production container builds |

---

## Quick Start (Docker Compose)

The fastest way to deploy the complete stack (Web frontend + PostgreSQL database) is using Docker Compose.

### 1. Clone & Configure Environment

```bash
# Clone the repository
git clone <repository-url>
cd chatbot/web

# Copy the sample environment file
cp .env.example .env
```

Edit `.env` to configure your credentials:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=mushibot_db
POSTGRES_PORT=5432
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 2. Launch Services

```bash
# Build and start all containers in detached mode
docker compose up --build -d
```

### 3. Access the Application

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **PostgreSQL Database**: `localhost:5432`

To check logs or stop the containers:

```bash
# View container logs
docker compose logs -f

# Stop and remove containers
docker compose down
```

---

## Local Development Setup

For local development and debugging, you can run the Next.js frontend and FastAPI backend individually.

### Prerequisites
- **Node.js**: `>= 20.9.0`
- **Python**: `>= 3.11` (with `uv` installed)
- **PostgreSQL**: PostgreSQL 16 with `pgvector` extension

### 1. Start the PostgreSQL Vector Database

```bash
# Run PostgreSQL with pgvector using Docker
docker run -d \
  --name chatbot-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mushibot_db \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### 2. Start the FastAPI Backend

```bash
cd api

# Install dependencies using uv
uv sync

# Run the FastAPI server with hot-reloading
uv run uvicorn main:app --port 8080 --reload
```

The API docs will be available at [http://localhost:8080/docs](http://localhost:8080/docs).

### 3. Start the Next.js Web Client

```bash
# In the web root directory
npm install

# Run the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables Reference

### Web Frontend (`web/.env`)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Base URL for the FastAPI backend API |
| `NODE_ENV` | `development` | Node environment (`development` / `production`) |
| `PORT` | `3000` | Port for the Next.js web application |

### Backend API (`api/.env`)
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/mushibot_db` | PostgreSQL connection string |
| `JWT_SECRET` | `change-me-...` | Secret key for signing agent authentication JWTs |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT token lifespan in minutes |
| `NEXTJS_URL` | `http://localhost:3000` | URL of the frontend for CORS and webhooks |
| `FASTAPI_INTERNAL_URL` | `http://127.0.0.1:8080` | Internal backend URL for workers and cron tasks |

---

## Project Structure

```text
chatbot/web/
├── api/                             # FastAPI Backend Service
│   ├── routes/                      # API Endpoints (auth, chat, channels, RAG, tools)
│   ├── services/                    # Business logic & LLM pipeline
│   ├── auth.py                      # JWT authentication & password hashing
│   ├── chat.py                      # Conversation engine & LangChain orchestration
│   ├── config.py                    # Environment & database settings
│   ├── knowledge.py                 # RAG document parsing & vector embedding
│   ├── mcp_executor.py              # Model Context Protocol stdio/SSE client
│   ├── models.py                    # SQLAlchemy database models
│   ├── schemas.py                   # Pydantic request/response schemas
│   ├── tools.py                     # Dynamic tool calling & schemas
│   └── main.py                      # FastAPI entrypoint
├── app/                             # Next.js App Router
│   ├── dashboard/                   # Management Dashboard
│   │   ├── channel/                 # WhatsApp & Telegram Session Management
│   │   ├── conversations/           # Live Chat & Conversation History
│   │   ├── knowledge/               # RAG Collections & Document Ingestion
│   │   ├── providers/               # LLM & Embedding Model Settings
│   │   ├── tools/                   # Function Tools, MCP & Scheduled Reminders
│   │   └── users/                   # Personnel & Role Management
│   ├── chat/                        # Customer Webchat Interface
│   ├── login/                       # Operator Authentication
│   ├── globals.css                  # Global Styles & Design System Tokens
│   └── layout.tsx                   # Root Layout
├── components/                      # Reusable UI Components
│   └── ui/                          # Button, Input, Modal, Portal
├── lib/                             # Shared Utilities & API Client
│   ├── api.ts                       # Axios / Fetch HTTP Client with interceptors
│   ├── hooks/                       # Custom React Hooks
│   └── utils/                       # Date, text, and byte formatters
├── docker-compose.yml               # Multi-container Compose configuration
├── Dockerfile                       # Multi-stage Next.js Dockerfile
├── package.json                     # Frontend dependencies & scripts
├── tsconfig.json                    # TypeScript compiler configuration
└── README.md                        # Documentation
```

---

## Available Scripts

In the frontend workspace (`chatbot/web`):

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server with hot reloading |
| `npm run build` | Compiles and builds the production Next.js bundle |
| `npm run start` | Runs the compiled production server |
| `npm run typecheck` | Runs `tsc --noEmit` to validate all TypeScript types |
| `npm run lint` | Runs ESLint to check for code quality and style issues |

---

## Security & Best Practices

- **JWT Secret**: Always set a cryptographically secure string for `JWT_SECRET` in production environments.
- **Database Backups**: Regularly backup the PostgreSQL database volume `postgres_data` to preserve vector embeddings and chat history.
- **Session Credentials**: WhatsApp session credentials generated by Baileys contain sensitive authentication keys and are stored in isolated persistent directories. Ensure proper file system access restrictions.

---

## License

This project is licensed under the **MIT License**.
