<div align="center">

<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript" />
<img src="https://img.shields.io/badge/Groq-LLaMA_3.1-F55036?style=for-the-badge" />
<img src="https://img.shields.io/badge/BullMQ-Job_Queue-E5002B?style=for-the-badge" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" />
<img src="https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis" />
<img src="https://img.shields.io/badge/Socket.io-4.7-010101?style=for-the-badge&logo=socket.io" />

# 🎓 VedaAI — AI Assessment Creator

**A production-ready platform that lets teachers generate complete, structured question papers using Groq AI in seconds — with real-time progress tracking, an AI toolkit, and a full class management system.**

[Live Demo](#) · [API Docs](./docs/API_SPEC.md) · [Architecture](./docs/HLD.md) · [Report a Bug](#)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Feature Set](#-feature-set)
- [System Architecture](#-system-architecture)
- [Generation Workflow](#-generation-workflow)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [WebSocket Events](#-websocket-events)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment-render)
- [Design Decisions](#-design-decisions)

---

## 🔍 Overview

VedaAI is a full-stack AI-powered assessment creation platform built for teachers. A teacher fills in a simple form — subject, class, question types, difficulty split, marks — and VedaAI does the rest:

1. The request is queued as a background job (BullMQ)
2. A worker builds a structured prompt and calls Groq AI (LLaMA 3.1 70B)
3. The JSON response is parsed, schema-validated, and stored in MongoDB
4. The teacher's browser receives real-time progress updates over WebSocket
5. A clean, printable question paper is displayed — with an answer key, difficulty badges, and PDF export

Beyond paper generation, VedaAI includes an **AI Teacher's Toolkit** — Auto Grader, Rubric Builder, Feedback Generator, Quick Quiz Creator, and an Analytics Dashboard with AI-generated insights.

---

## ✨ Feature Set

### Core — Assignment & Paper Generation
| Feature | Detail |
|---|---|
| **Assignment Form** | 2-step wizard — configure title, class, subject, due date, question types, per-section marks, difficulty distribution, and additional instructions |
| **Question Plan** | Per question-type control: choose the type, number of questions, and marks per question independently |
| **AI Generation** | Groq LLaMA 3.1 70B with JSON mode + Zod schema validation; auto-retries up to 2× on parse failure |
| **Real-time Progress** | WebSocket (Socket.io) pushes 10 progress steps live to the browser; HTTP polling as fallback |
| **Question Paper View** | Structured output: school header, student info fields, sections (A/B/C…), difficulty badges, marks per question, printable answer key |
| **PDF Export** | Browser print-to-PDF with print-specific CSS (hides UI chrome, preserves exam layout) |
| **Regenerate** | One-click regeneration from the paper view; deletes old paper + cache, re-queues job |
| **Assignment Library** | List, search, filter, and delete assignments with optimistic UI updates |

### AI Toolkit (6 Tools)
| Tool | What it does |
|---|---|
| **Question Paper Generator** | Main feature — full exam paper from config |
| **Auto Grader** | Grade any student answer against a question; returns score, grade (A+→F), strengths, improvements, detailed breakdown |
| **Rubric Builder** | Generate a multi-criteria marking rubric for essays, projects, or practicals with 4-level descriptors |
| **Feedback Generator** | Produce personalised, tone-adjustable (Encouraging / Neutral / Strict) written feedback for a student |
| **Quick Quiz Creator** | Generate a 3–10 question MCQ/True-False formative quiz in under 30 seconds |
| **Analytics Dashboard** | Stats on assignments by status, subject, question type, over time, average marks — plus 3 AI-generated actionable insights |

### Class Management
- **Groups** — Create class groups; assign assignments to a group
- **Students** — Add/manage students within each group
- **School Profile** — Set institution name (shown on generated papers)

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Next.js 15  (App Router + TypeScript)           │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │  │
│  │  │  Assignment  │  │  Paper View  │  │   AI Toolkit      │  │  │
│  │  │  Form        │  │  + PDF Print │  │  (6 tools)        │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │  │
│  │         │                 │                    │             │  │
│  │  ┌──────┴─────────────────┴────────────────────┴──────────┐  │  │
│  │  │         Zustand Stores  (assignment / generation /      │  │  │
│  │  │                          paper / analytics)             │  │  │
│  │  └──────────────────────────────────────────┬─────────────┘  │  │
│  │                                             │                 │  │
│  │  ┌──────────────────┐      ┌────────────────┴─────────────┐  │  │
│  │  │  Socket.io-client│◄────►│       Axios HTTP Client      │  │  │
│  │  │  (WS + polling)  │      │       (lib/api.ts)           │  │  │
│  │  └────────┬─────────┘      └──────────────────────────────┘  │  │
│  └───────────┼──────────────────────────────────────────────────┘  │
└──────────────┼──────────────────────────────────────────────────────┘
               │ WebSocket (ws://)           │ HTTP REST
               ▼                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SERVER LAYER                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Node.js + Express (TypeScript)  :4000              │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │                   Middleware Stack                    │   │  │
│  │  │  Helmet · CORS · Morgan · express-rate-limit · Zod   │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │                                                              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │/assign-  │ │/ai       │ │/groups   │ │/analytics    │  │  │
│  │  │ments     │ │(toolkit) │ │/students │ │/profile      │  │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │  │
│  │       │             │             │               │          │  │
│  │  ┌────┴─────────────┴─────────────┴───────────────┴──────┐  │  │
│  │  │                     Services Layer                      │  │  │
│  │  │   AssignmentService · PaperService · QueueService      │  │  │
│  │  │   CacheService · Analytics                              │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  ┌────────────────────────┐  ┌──────────────────────────┐   │  │
│  │  │   Socket.io Gateway    │  │    BullMQ Worker         │   │  │
│  │  │   (room-based events)  │  │  (generation.worker.ts)  │   │  │
│  │  └────────────┬───────────┘  └────────────┬─────────────┘   │  │
│  └───────────────┼──────────────────────────-┼─────────────────┘  │
└──────────────────┼────────────────────────────┼────────────────────┘
                   │                            │
          ┌────────┴────────────────────────────┴────────┐
          │               INFRASTRUCTURE                  │
          │                                               │
          │  ┌─────────────┐  ┌──────────┐  ┌─────────┐ │
          │  │  MongoDB    │  │  Redis   │  │  Groq   │ │
          │  │  Atlas      │  │  Upstash │  │  API    │ │
          │  │             │  │          │  │  (LLM)  │ │
          │  │  Assignments│  │  BullMQ  │  │         │ │
          │  │  Papers     │  │  Queue   │  │ LLaMA   │ │
          │  │  Groups     │  │  Cache   │  │ 3.1 70B │ │
          │  │  Students   │  │  (TTL)   │  │         │ │
          │  └─────────────┘  └──────────┘  └─────────┘ │
          └───────────────────────────────────────────────┘
```

---

## 🔄 Generation Workflow

This is the end-to-end flow from the moment a teacher clicks **"Generate Paper"**:

```
TEACHER BROWSER                  EXPRESS API              BULLMQ + WORKER           GROQ AI
      │                              │                          │                       │
      │  POST /assignments           │                          │                       │
      │ ─────────────────────────►  │                          │                       │
      │                              │  Validate (Zod)          │                       │
      │                              │  Save to MongoDB         │                       │
      │                              │  Enqueue job             │                       │
      │                              │ ─────────────────────►  │                       │
      │  { assignmentId, jobId }     │                          │                       │
      │ ◄─────────────────────────  │                          │                       │
      │                              │                          │                       │
      │  WS: join room               │                          │                       │
      │ ─────────────────────────────────────────────────────► │                       │
      │                              │                          │                       │
      │  [WS] generation:started     │                          │                       │
      │ ◄──────────────────────────────────────────────────── │                       │
      │  progress: 5%                │                          │                       │
      │                              │                          │  Build prompt         │
      │  [WS] progress: 15%          │                          │ ─────────────────►   │
      │ ◄──────────────────────────────────────────────────── │                       │
      │  "Building AI prompt..."     │                          │                       │
      │                              │                          │  Groq API call        │
      │                              │                          │ ──────────────────────►
      │  [WS] progress: 30%          │                          │                       │
      │ ◄──────────────────────────────────────────────────── │  JSON response        │
      │  "Sending to Groq AI..."     │                          │ ◄─────────────────────
      │                              │                          │                       │
      │                              │                          │  Parse + Zod validate │
      │                              │                          │  (retry ×2 on fail)   │
      │  [WS] progress: 70%          │                          │                       │
      │ ◄──────────────────────────────────────────────────── │                       │
      │  "Processing AI response"    │                          │                       │
      │                              │                          │                       │
      │                              │                          │  Save paper to MongoDB│
      │                              │                          │  Cache in Redis (1hr) │
      │                              │                          │  Update assignment    │
      │  [WS] progress: 95%          │                          │  status → completed   │
      │ ◄──────────────────────────────────────────────────── │                       │
      │                              │                          │                       │
      │  [WS] generation:completed   │                          │                       │
      │  { paperId }                 │                          │                       │
      │ ◄──────────────────────────────────────────────────── │                       │
      │                              │                          │                       │
      │  router.push(/paper)         │                          │                       │
      │  GET /assignments/:id/paper  │                          │                       │
      │ ─────────────────────────►  │                          │                       │
      │                              │  Cache HIT (Redis)?      │                       │
      │                              │  → Return cached         │                       │
      │                              │  Cache MISS?             │                       │
      │                              │  → MongoDB query + cache │                       │
      │  { paper data }              │                          │                       │
      │ ◄─────────────────────────  │                          │                       │
      │                              │                          │                       │
      │  Render QuestionPaper UI     │                          │                       │
      ▼                              ▼                          ▼                       ▼
```

### AI Prompt Architecture

The prompt sent to Groq is built in two layers:

```
┌─────────────────────────────────────────────────────────┐
│                    SYSTEM PROMPT                         │
│  Role: Expert educator + exam creator                   │
│  Rules: JSON-only output, exact schema, mark accuracy   │
│  Schema: Full JSON structure with field definitions     │
└─────────────────────────────────────────────────────────┘
                          +
┌─────────────────────────────────────────────────────────┐
│                     USER PROMPT                          │
│  Title, Class, Subject, Total Marks                     │
│  Question Plan (per type: count + marks)                │
│  Difficulty Distribution (easy/medium/hard %)           │
│  Additional Teacher Instructions                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
                   Groq LLaMA 3.1 70B
                   (JSON mode enabled)
                          │
                          ▼
             ResponseParser (responseParser.ts)
             ├── JSON.parse()
             ├── Zod schema validation
             │   ├── Section structure
             │   ├── MCQ must have 4 options
             │   └── All required fields present
             └── On failure → retry with error context (×2)
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15.3 | App Router, SSR, routing |
| **React** | 19 | UI rendering |
| **TypeScript** | 5 | Type safety |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **Zustand** | 5 | Client state management (assignments, generation, paper) |
| **Socket.io-client** | 4.7 | Real-time WebSocket events |
| **Axios** | 1.7 | HTTP client with interceptors |
| **React Hook Form** | 7.52 | Form state + validation |
| **Zod** | 3.23 | Schema validation (shared with backend) |
| **Radix UI** | Latest | Accessible UI primitives (slider, select, toast) |
| **Lucide React** | 1.16 | Icon set |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express** | 4.19 | HTTP server + REST API |
| **TypeScript** | 5.4 | Type-safe server code |
| **Mongoose** | 8.4 | MongoDB ODM |
| **BullMQ** | 5.4 | Redis-backed job queue for async AI generation |
| **Socket.io** | 4.7 | WebSocket server for real-time events |
| **ioredis** | 5.3 | Redis client (BullMQ + cache) |
| **Groq SDK** | 0.3 | LLM API client |
| **Zod** | 3.23 | Request validation |
| **Winston** | 3.13 | Structured logging |
| **Helmet + CORS** | Latest | Security middleware |
| **express-rate-limit** | 7.3 | Rate limiting |

### Infrastructure & Services
| Service | Role |
|---|---|
| **MongoDB Atlas** | Primary database — assignments, papers, groups, students, profiles |
| **Upstash Redis** | BullMQ queue backend + paper result cache (TTL: 1 hour) |
| **Groq Cloud** | LLM inference (LLaMA 3.1 70B Versatile, JSON mode) |
| **Render.com** | Cloud deployment — backend (web service) + frontend (static/SSR) |
| **Docker Compose** | Local development — MongoDB + Redis containers |

---

## 📁 Project Structure

```
VedaAI/
├── backend/
│   ├── src/
│   │   ├── ai/
│   │   │   ├── llmClient.ts          # Groq SDK wrapper (singleton)
│   │   │   ├── promptBuilder.ts      # System + user prompt construction
│   │   │   └── responseParser.ts     # JSON parse + Zod validation + retry logic
│   │   │
│   │   ├── config/
│   │   │   ├── db.ts                 # Mongoose connect/disconnect
│   │   │   ├── env.ts                # Zod-validated environment variables
│   │   │   └── redis.ts              # ioredis clients (shared + BullMQ)
│   │   │
│   │   ├── controllers/
│   │   │   ├── assignment.controller.ts   # CRUD + status endpoints
│   │   │   ├── paper.controller.ts        # GET paper + regenerate
│   │   │   ├── ai.controller.ts           # Toolkit: grader, rubric, feedback, quiz
│   │   │   ├── analytics.controller.ts    # Dashboard stats + AI insights
│   │   │   ├── GroupController.ts         # Class group management
│   │   │   └── StudentController.ts       # Student management
│   │   │
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts       # Global error handler
│   │   │   ├── rateLimiter.ts        # Per-route rate limiting
│   │   │   └── validate.ts           # Zod request body validation
│   │   │
│   │   ├── models/
│   │   │   ├── Assignment.model.ts   # Assignment schema (with questionPlan)
│   │   │   ├── QuestionPaper.model.ts # Sections + Questions schema
│   │   │   ├── Group.model.ts        # Class group schema
│   │   │   ├── Student.model.ts      # Student schema
│   │   │   └── SchoolProfile.model.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts              # Route aggregator + /health
│   │   │   ├── assignment.routes.ts  # POST / GET / DELETE + paper sub-routes
│   │   │   ├── ai.routes.ts          # /grade /rubric /feedback /quiz
│   │   │   ├── analytics.routes.ts   # /analytics/dashboard
│   │   │   ├── group.routes.ts
│   │   │   ├── student.routes.ts
│   │   │   └── profile.routes.ts
│   │   │
│   │   ├── services/
│   │   │   ├── assignment.service.ts # DB operations for assignments
│   │   │   ├── paper.service.ts      # Create/fetch paper with Redis cache
│   │   │   ├── queue.service.ts      # BullMQ queue + job status
│   │   │   └── cache.service.ts      # Redis get/set/del/exists helpers
│   │   │
│   │   ├── socket/
│   │   │   └── gateway.ts            # Socket.io room management + event emitters
│   │   │
│   │   ├── workers/
│   │   │   └── generation.worker.ts  # BullMQ worker — 10-step AI generation pipeline
│   │   │
│   │   ├── utils/
│   │   │   ├── asyncHandler.ts       # Express async error wrapper
│   │   │   └── logger.ts             # Winston logger config
│   │   │
│   │   └── server.ts                 # Bootstrap: DB → Redis → Express → Socket.io → Worker
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # Dashboard — stats, recent assignments
│   │   ├── create/page.tsx           # Assignment creation entry
│   │   ├── assignments/
│   │   │   ├── page.tsx              # Assignment list with search
│   │   │   └── [id]/
│   │   │       ├── status/page.tsx   # Real-time generation progress
│   │   │       └── paper/page.tsx    # Generated question paper
│   │   ├── groups/
│   │   │   ├── page.tsx              # Class groups list
│   │   │   └── [id]/page.tsx         # Group detail + students
│   │   ├── toolkit/
│   │   │   ├── page.tsx              # AI Toolkit hub
│   │   │   ├── auto-grader/          # Auto grader tool
│   │   │   ├── rubric-builder/       # Rubric builder tool
│   │   │   ├── feedback-generator/   # Feedback generator tool
│   │   │   ├── quick-quiz/           # Quick quiz creator
│   │   │   └── analytics/            # Analytics dashboard
│   │   ├── library/page.tsx          # Paper library
│   │   └── profile/page.tsx          # School profile settings
│   │
│   ├── components/
│   │   ├── forms/
│   │   │   ├── AssignmentForm.tsx    # 2-step form with question plan builder
│   │   │   ├── DifficultyDistribution.tsx  # Difficulty sliders
│   │   │   └── QuestionTypeSelector.tsx
│   │   ├── paper/
│   │   │   ├── QuestionPaper.tsx     # Full paper renderer with answer key
│   │   │   ├── SectionBlock.tsx      # Section (A/B/C) renderer
│   │   │   ├── QuestionCard.tsx      # Individual question with badge
│   │   │   ├── DifficultyBadge.tsx   # Easy/Medium/Hard colour badge
│   │   │   └── StudentInfoSection.tsx
│   │   ├── layout/                   # AppShell, Sidebar, TopBar, MobileNav
│   │   ├── cards/                    # AssignmentCard
│   │   ├── common/                   # ActionBar, ProgressBar, Spinner
│   │   └── modals/                   # SchoolProfileModal
│   │
│   ├── hooks/
│   │   ├── useAssignmentSocket.ts    # Socket.io room join + event listeners
│   │   └── useGenerationStatus.ts    # HTTP polling fallback (5s interval)
│   │
│   ├── stores/
│   │   ├── assignmentStore.ts        # Assignment form state (Zustand)
│   │   ├── generationStore.ts        # Generation status + progress (Zustand)
│   │   └── paperStore.ts             # Paper data cache (Zustand)
│   │
│   ├── lib/
│   │   ├── api.ts                    # Axios instance + all API methods
│   │   └── socket.ts                 # Socket.io singleton factory
│   │
│   ├── types/index.ts                # All shared TypeScript interfaces
│   └── validations/assignmentSchema.ts
│
├── docs/
│   ├── HLD.md                        # High-level design
│   ├── LLD.md                        # Low-level design
│   ├── API_SPEC.md                   # Full REST API specification
│   ├── DB_SCHEMA.md                  # MongoDB collections documentation
│   ├── WEBSOCKET_SPEC.md             # WebSocket event contracts
│   ├── AI_PROMPT_DESIGN.md           # Prompt engineering decisions
│   ├── TECH_STACK.md                 # Detailed technology rationale
│   └── IMPLEMENTATION_PLAN.md
│
├── docker-compose.yml                # Local MongoDB + Redis
└── render.yaml                       # Render.com deployment blueprint
```

---

## 🗄 Database Schema

### Collections Overview

```
MongoDB Atlas — "vedaai" database

  assignments                    question_papers
  ┌──────────────────────┐      ┌──────────────────────────┐
  │ _id: ObjectId         │      │ _id: ObjectId             │
  │ title: string         │      │ assignmentId: ObjectId ──►│
  │ className: string     │      │ title: string             │
  │ subject: string       │  1:1 │ subject: string           │
  │ dueDate: Date         │◄────►│ className: string         │
  │ totalMarks: number    │      │ totalMarks: number        │
  │ totalQuestions: number│      │ sections: [               │
  │ questionTypes: [str]  │      │   sectionLabel: string    │
  │ questionPlan: [       │      │   title: string           │
  │   type: string        │      │   instruction: string     │
  │   questions: number   │      │   totalMarks: number      │
  │   marks: number       │      │   questions: [            │
  │ ]                     │      │     questionNumber: int   │
  │ difficultyDistribution│      │     text: string          │
  │   easy: number        │      │     type: enum            │
  │   medium: number      │      │     difficulty: enum      │
  │   hard: number        │      │     marks: number         │
  │ additionalInstructions│      │     options?: [string]    │
  │ status: enum          │      │     answer?: string       │
  │ jobId: string         │      │   ]                       │
  │ paperId: ObjectId ───►│      │ ]                         │
  │ groupId: ObjectId ───►│      │ metadata: {               │
  │ createdAt: Date       │      │   generatedAt: Date       │
  │ updatedAt: Date       │      │   llmModel: string        │
  └──────────────────────┘      │   promptTokens: number    │
                                 │   totalTokens: number     │
                                 │ }                         │
                                 │ pdfUrl?: string           │
                                 └──────────────────────────┘

  groups                         students
  ┌──────────────────────┐      ┌──────────────────────────┐
  │ _id: ObjectId         │      │ _id: ObjectId             │
  │ name: string          │  1:N │ groupId: ObjectId ───────►│
  │ subject: string       │◄────►│ name: string              │
  │ description: string   │      │ rollNumber: string        │
  └──────────────────────┘      └──────────────────────────┘

  school_profiles
  ┌──────────────────────┐
  │ _id: ObjectId         │
  │ name: string          │
  │ address: string       │
  └──────────────────────┘

Redis (Upstash) — Key Patterns

  Key pattern            │ Type   │ TTL      │ Purpose
  ───────────────────────┼────────┼──────────┼──────────────────────
  veda:paper:<id>        │ String │ 3600s    │ Cached QuestionPaper JSON
  bull:questionGeneration│ Hash   │ Managed  │ BullMQ job data
  bull:questionGeneration│ ZSet   │ Managed  │ BullMQ queue state
```

---

## 🌐 API Reference

### Base URL
```
Development:  http://localhost:4000/api/v1
Production:   https://your-backend.onrender.com/api/v1
```

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/assignments` | Create assignment & queue generation job |
| `GET` | `/assignments` | List assignments (pagination + status filter) |
| `GET` | `/assignments/:id` | Get single assignment |
| `DELETE` | `/assignments/:id` | Delete assignment |
| `GET` | `/assignments/:id/status` | Poll generation job status |
| `GET` | `/assignments/:id/paper` | Get generated question paper |
| `POST` | `/assignments/:id/regenerate` | Delete paper + re-queue generation |

**POST `/assignments` — Request Body:**
```json
{
  "title": "Mid-Term Science Test",
  "className": "Class 10",
  "subject": "Physics",
  "dueDate": "2025-06-30T00:00:00.000Z",
  "totalMarks": 80,
  "totalQuestions": 20,
  "questionTypes": ["MCQ", "SHORT", "LONG"],
  "questionPlan": [
    { "type": "MCQ",   "questions": 10, "marks": 2 },
    { "type": "SHORT", "questions": 6,  "marks": 5 },
    { "type": "LONG",  "questions": 4,  "marks": 10 }
  ],
  "difficultyDistribution": { "easy": 40, "medium": 40, "hard": 20 },
  "additionalInstructions": "Focus on Ohm's Law and electromagnetism"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assignmentId": "665a1b2c3d4e5f6a7b8c9d0e",
    "jobId": "gen-665a1b2c3d4e5f6a7b8c9d0e-1717824000000",
    "status": "queued"
  }
}
```

### AI Toolkit

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/grade` | Auto-grade a student answer |
| `POST` | `/ai/rubric` | Generate a marking rubric |
| `POST` | `/ai/feedback` | Generate personalised student feedback |
| `POST` | `/ai/quiz` | Create a quick formative quiz |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/dashboard` | Full stats + AI-generated insights |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET/POST/PUT/DELETE` | `/groups` | Class group management |
| `GET/POST/PUT/DELETE` | `/students` | Student management |
| `GET/PUT` | `/profile` | School profile |

---

## 📡 WebSocket Events

Socket.io is used for real-time generation progress. The client joins a room per assignment.

### Client → Server
```js
// Join the room for a specific assignment
socket.emit('join', { assignmentId: '665a...' });

// Leave the room
socket.emit('leave', { assignmentId: '665a...' });
```

### Server → Client
| Event | Payload | When |
|-------|---------|------|
| `generation:started` | `{ jobId, message, assignmentId, timestamp }` | Worker picks up the job |
| `generation:progress` | `{ jobId, progress: 0-100, stage: string, assignmentId, timestamp }` | Each step of the pipeline |
| `generation:completed` | `{ jobId, paperId, message, assignmentId, timestamp }` | Paper saved successfully |
| `generation:failed` | `{ jobId, errorCode, message, assignmentId, timestamp }` | Any unrecoverable error |

**Progress Stages:**
```
5%   →  "Question generation started"
15%  →  "Building AI prompt..."
30%  →  "Sending to Groq AI..."
70%  →  "Processing AI response..."
80%  →  "Validating question paper..."
90%  →  "Saving to database..."
95%  →  "Finalizing..."
100% →  Complete → generation:completed emitted
```

---

## 🚀 Local Setup

### Prerequisites
- **Node.js** v18+
- **Docker & Docker Compose** (for local MongoDB + Redis)
- **Groq API Key** — free at [console.groq.com](https://console.groq.com)

### Step 1 — Clone & Install

```bash
git clone https://github.com/your-username/vedaai.git
cd vedaai

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Step 2 — Start Infrastructure

```bash
# From project root — starts MongoDB on :27017 and Redis on :6379
docker compose up -d

# Verify both containers are healthy
docker compose ps
```

### Step 3 — Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set GROQ_API_KEY and MONGODB_URI/REDIS_URL (see below)

# Frontend
cp frontend/.env.example frontend/.env.local
# Usually no changes needed for local dev
```

For local development with Docker, use these values in `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
```

### Step 4 — Run

```bash
# Terminal 1 — Backend (starts on :4000)
cd backend && npm run dev

# Terminal 2 — Frontend (starts on :3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 5 — Verify

Visit `http://localhost:4000/api/v1/health` — should return:
```json
{ "success": true, "service": "VedaAI API", "timestamp": "..." }
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `4000` | HTTP server port |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas or local connection string |
| `REDIS_URL` | **Yes** | — | Upstash Redis TLS URL (`rediss://...`) or local (`redis://localhost:6379`) |
| `GROQ_API_KEY` | **Yes** | — | From [console.groq.com/keys](https://console.groq.com/keys) |
| `LLM_MODEL` | No | `llama-3.1-70b-versatile` | Groq model name |
| `FRONTEND_URL` | No | `http://localhost:3000` | Allowed CORS origin |
| `REDIS_TTL_PAPER` | No | `3600` | Paper cache TTL in seconds |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000/api/v1` | Backend REST API base URL |
| `NEXT_PUBLIC_WS_URL` | No | `http://localhost:4000` | Backend WebSocket URL |

---

## ☁️ Deployment (Render)

VedaAI ships with a `render.yaml` blueprint — one command deploys both services.

### Prerequisites
1. [MongoDB Atlas](https://mongodb.com/atlas) free cluster — copy the connection string
2. [Upstash Redis](https://upstash.com) free database — copy the `ioredis` (TLS) URL
3. [Groq API Key](https://console.groq.com/keys)

### Deploy

```bash
# Connect your GitHub repo to Render
# Render will auto-detect render.yaml and create both services

# OR deploy manually:
# 1. Create a new "Web Service" on Render
# 2. Root Directory: backend | Build: npm install && npm run build | Start: npm start
# 3. Add all env vars from the table above
# Repeat for frontend with rootDir: frontend
```

### Environment Variables on Render

Set these in the Render dashboard for the **backend** service:
- `MONGODB_URI` — your Atlas connection string
- `REDIS_URL` — your Upstash TLS URL (starts with `rediss://`)
- `GROQ_API_KEY` — your Groq key
- `FRONTEND_URL` — your deployed frontend URL (e.g., `https://vedaai.onrender.com`)

Set these for the **frontend** service:
- `NEXT_PUBLIC_API_URL` — `https://your-backend.onrender.com/api/v1`
- `NEXT_PUBLIC_WS_URL` — `https://your-backend.onrender.com`

> **Note:** On Render's free tier, services sleep after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. Upgrade to a paid instance for production use.

---

## 🧠 Design Decisions

### Why BullMQ instead of calling Groq directly in the API handler?
LLM calls take 5–15 seconds. Doing this synchronously in an HTTP handler means the request can time out on slow connections, you lose retry logic, and you can't report progress. BullMQ decouples the job from the HTTP response: the API returns immediately with a job ID, and the worker handles all the heavy lifting with retries, progress tracking, and error recovery.

### Why Zustand instead of Redux?
The state in VedaAI is mostly server-state (API data) and a few small client-state slices (form state, generation status). Zustand's minimal API fits this perfectly — no actions, reducers, or boilerplate. The three stores (assignment, generation, paper) are each under 30 lines.

### Why Redis for caching AND as the BullMQ queue backend?
Both use the same Upstash Redis instance but different key namespaces — `veda:paper:*` for cache and `bull:*` for BullMQ. This reduces infrastructure cost. In production with high load, separating them is straightforward.

### Why Groq + LLaMA instead of OpenAI?
Groq's hardware inference is significantly faster (typically 3–5× for this model size) which matters for UX — teachers don't want to wait 30 seconds for their paper. LLaMA 3.1 70B with JSON mode produces well-structured output at a quality level that's sufficient for exam question generation. Groq's free tier is also generous enough for development.

### Why does the worker run in the same process as the Express server?
For a Render.com single-dyno deployment (the most common free deployment target), running a separate worker process would require a second paid instance. Running the BullMQ worker in the same Node process works because it runs on a separate event loop tick and doesn't block the HTTP server. For scale-out, the worker can be trivially moved to a separate `worker.ts` entrypoint.

---

## 📚 Additional Documentation

| Document | Contents |
|---|---|
| [`docs/HLD.md`](./docs/HLD.md) | High-level system design, component diagrams |
| [`docs/LLD.md`](./docs/LLD.md) | Low-level design, class diagrams, sequence flows |
| [`docs/API_SPEC.md`](./docs/API_SPEC.md) | Full REST API specification with request/response examples |
| [`docs/DB_SCHEMA.md`](./docs/DB_SCHEMA.md) | MongoDB collection schemas and indexes |
| [`docs/WEBSOCKET_SPEC.md`](./docs/WEBSOCKET_SPEC.md) | WebSocket event contracts and room management |
| [`docs/AI_PROMPT_DESIGN.md`](./docs/AI_PROMPT_DESIGN.md) | Prompt engineering rationale and schema design |
| [`docs/TECH_STACK.md`](./docs/TECH_STACK.md) | Technology choices and tradeoffs |

---

## 👤 Author

**Nikhil Kumar**

Built as a Full Stack Engineering Assignment for VedaAI.

[![GitHub](https://img.shields.io/badge/GitHub-nikhil7591-181717?style=flat&logo=github)](https://github.com/nikhil7591)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-nikhil--kumar-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/nikhil-kumar-2974292a9)

---

<div align="center">
<sub>Built with Next.js · Express · Groq AI · MongoDB · Redis · Socket.io</sub>
</div>