# High-Level Design (HLD)
## VedaAI – AI Assessment Creator

---

## 1. System Overview

The VedaAI Assessment Creator is a full-stack web application that enables teachers to create assignment configurations, trigger AI-powered question paper generation, and view/download the structured output. The system is built around an asynchronous job processing pipeline with real-time feedback to the client via WebSockets.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│                                                                     │
│   ┌─────────────────┐   ┌──────────────────┐  ┌────────────────┐  │
│   │  Assignment      │   │  Generation       │  │  Output /      │  │
│   │  Creation Form   │   │  Status Screen    │  │  Question Paper│  │
│   │  (Next.js page) │   │  (WebSocket live) │  │  Page          │  │
│   └────────┬────────┘   └────────▲──────────┘  └───────▲────────┘  │
│            │  REST POST          │  WS Events           │ REST GET  │
└────────────┼─────────────────────┼──────────────────────┼───────────┘
             │                     │                       │
             ▼                     │                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND  (Node.js + Express + TypeScript)    │
│                                                                     │
│   ┌──────────────────┐    ┌──────────────────┐                     │
│   │   REST API        │    │   WebSocket       │                     │
│   │   /api/v1/*       │    │   Server          │                     │
│   │   (Express Router)│    │   (Socket.io)     │                     │
│   └────────┬─────────┘    └────────▲──────────┘                    │
│            │                       │                                │
│            │  Enqueue Job          │  Emit Events                  │
│            ▼                       │                                │
│   ┌──────────────────┐    ┌────────┴──────────┐                    │
│   │   BullMQ          │    │   Job Worker       │                    │
│   │   Queue Manager   │───►│   (Generation +    │                    │
│   │                   │    │    PDF Worker)     │                    │
│   └──────────────────┘    └────────┬──────────┘                    │
│                                    │                                │
└────────────────────────────────────┼────────────────────────────────┘
                                     │
          ┌──────────────────────────┼─────────────────────┐
          │                          │                      │
          ▼                          ▼                      ▼
┌─────────────────┐      ┌──────────────────┐   ┌──────────────────┐
│    MongoDB       │      │     Redis         │   │   LLM API        │
│  (Persistent     │      │  (Job State +     │   │  (OpenAI /       │
│   Storage)       │      │   Cache)          │   │   Anthropic /    │
│                  │      │                   │   │   OSS Ollama)    │
│  - assignments   │      │  - job:{id}:state │   │                  │
│  - papers        │      │  - cache:paper:id │   │  Structured JSON │
└─────────────────┘      └──────────────────┘   │  response        │
                                                  └──────────────────┘
```

---

## 3. Core Components

### 3.1 Frontend (Next.js 14 + TypeScript)

| Page / Component         | Responsibility                                                      |
|--------------------------|---------------------------------------------------------------------|
| `/create`                | Assignment creation form — file upload, config, validation          |
| `/assignments/[id]/status` | Real-time job progress screen via WebSocket                       |
| `/assignments/[id]/paper`  | Rendered question paper with sections, difficulty tags, PDF export |
| `Zustand stores`         | Global state for form data, job status, paper data                  |
| `Socket.io client`       | Subscribe to job room, receive generation events                    |

### 3.2 Backend (Express + TypeScript)

| Module              | Responsibility                                                       |
|---------------------|----------------------------------------------------------------------|
| `AssignmentController` | Validates input, persists to MongoDB, enqueues BullMQ job         |
| `PaperController`   | Fetches generated paper, serves cached result                        |
| `JobController`     | Exposes job status endpoint                                          |
| `SocketGateway`     | Manages rooms keyed by assignmentId, emits progress/completion       |
| `GenerationWorker`  | BullMQ worker — calls LLM, parses JSON, stores result               |
| `PDFWorker`         | BullMQ worker — renders PDF from structured data (bonus)            |

### 3.3 Data Stores

| Store    | Purpose                                          |
|----------|--------------------------------------------------|
| MongoDB  | Persistent storage for assignments and papers    |
| Redis    | BullMQ job queue backing store + result cache    |

### 3.4 AI Layer

| Component       | Responsibility                                              |
|-----------------|-------------------------------------------------------------|
| `PromptBuilder` | Converts assignment config into a structured LLM prompt     |
| `LLMClient`     | Abstracted client supporting OpenAI / Anthropic / Ollama    |
| `ResponseParser`| Validates and transforms raw LLM JSON into internal schema  |

---

## 4. Data Flow — End to End

```
Step 1: Teacher submits assignment form
        POST /api/v1/assignments
        └── Validate input (Zod)
        └── Save Assignment doc to MongoDB  →  assignmentId
        └── Enqueue job to BullMQ questionGenerationQueue
        └── Return { assignmentId, jobId }

Step 2: Frontend subscribes to WebSocket room
        socket.emit("join", { assignmentId })
        └── Server adds client to room `assignment:{assignmentId}`

Step 3: BullMQ Worker picks up job
        └── Emit "generation:started" to room
        └── Build prompt from assignment config
        └── Call LLM API (streaming optional)
        └── Emit "generation:progress" with percentage
        └── Parse and validate LLM JSON response
        └── Store QuestionPaper doc in MongoDB
        └── Cache result in Redis (TTL 3600s)
        └── Update job state in Redis
        └── Emit "generation:completed" with paperId

Step 4: Frontend receives "generation:completed"
        └── Navigate to /assignments/{id}/paper
        └── GET /api/v1/assignments/{id}/paper
        └── Render structured question paper

Step 5 (Bonus): Teacher clicks "Download PDF"
        └── POST /api/v1/assignments/{id}/pdf
        └── Enqueue pdfGenerationQueue job
        └── Worker renders PDF, stores file
        └── Return download URL
```

---

## 5. Deployment Architecture

```
┌──────────────────┐         ┌────────────────────┐
│   Vercel          │         │   Railway / Render  │
│   (Frontend)      │ HTTPS   │   (Backend)         │
│   Next.js App     │◄───────►│   Express + Workers │
└──────────────────┘         └─────────┬──────────┘
                                        │
                          ┌─────────────┼─────────────┐
                          │             │             │
                   ┌──────▼──┐  ┌───────▼──┐  ┌──────▼────┐
                   │ MongoDB  │  │  Redis    │  │  LLM API  │
                   │  Atlas   │  │  Upstash  │  │ (OpenAI)  │
                   └─────────┘  └──────────┘  └───────────┘
```

---

## 6. Non-Functional Requirements

| Concern          | Approach                                                         |
|------------------|------------------------------------------------------------------|
| **Scalability**  | BullMQ workers can be scaled horizontally                        |
| **Reliability**  | BullMQ retry with exponential backoff (3 attempts)               |
| **Performance**  | Redis caching for generated papers (1hr TTL)                     |
| **Security**     | Input validation (Zod), rate limiting (express-rate-limit)       |
| **Observability**| Winston structured logging, BullMQ job event hooks               |
| **Responsiveness**| TailwindCSS responsive layout — mobile, tablet, desktop         |

---

## 7. Key Design Decisions

1. **Async processing via BullMQ** — LLM calls can take 5–30s. Doing this synchronously in a REST handler would cause timeouts and poor UX. Moving to a background job with WebSocket notifications gives a smooth experience.

2. **Zustand over Redux** — The state shape is simple and co-located. Zustand eliminates boilerplate while still being testable and devtools-compatible.

3. **Do NOT render raw LLM response** — The worker always parses LLM output through a strict Zod schema before storage. The frontend only ever renders validated structured data.

4. **MongoDB for flexible schema** — Question papers can vary in structure (different section counts, question types). MongoDB's document model fits this naturally.

5. **Redis dual-use** — Acts as both BullMQ's backing store AND a result cache, reducing redundant MongoDB reads on the paper view page.
