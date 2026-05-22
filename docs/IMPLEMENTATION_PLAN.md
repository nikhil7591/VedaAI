# Implementation Plan
## VedaAI – AI Assessment Creator

**Total Estimated Time:** 3–4 days  
**Deadline:** 21 March 11:59 PM

---

## Phase Overview

```
Phase 1 — Project Setup & Scaffolding          (2–3 hours)
Phase 2 — Backend Core: API + DB + Queue       (4–5 hours)
Phase 3 — AI Integration                       (2–3 hours)
Phase 4 — WebSocket Layer                      (1–2 hours)
Phase 5 — Frontend: Assignment Form            (3–4 hours)
Phase 6 — Frontend: Status Screen             (1–2 hours)
Phase 7 — Frontend: Question Paper Output      (3–4 hours)
Phase 8 — Bonus Features                       (2–3 hours)
Phase 9 — Testing, Polish & Deployment         (2–3 hours)
```

---

## Phase 1 — Project Setup & Scaffolding

### Tasks
- [ ] Initialize monorepo structure: `frontend/` and `backend/` folders
- [ ] **Frontend:** `npx create-next-app@latest frontend --typescript --tailwind --app`
- [ ] **Backend:** `mkdir backend && cd backend && npm init -y && tsc --init`
- [ ] Install all frontend dependencies (see TECH_STACK.md)
- [ ] Install all backend dependencies (see TECH_STACK.md)
- [ ] Set up `docker-compose.yml` for MongoDB + Redis local dev
- [ ] Create `.env` files for both frontend and backend
- [ ] Set up ESLint + Prettier in both projects
- [ ] Set up `tsconfig.json` for strict TypeScript in backend

### docker-compose.yml (starter)
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports: ['27017:27017']
    volumes: ['mongo_data:/data/db']
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
volumes:
  mongo_data:
```

### Verification
- `docker-compose up -d` starts MongoDB + Redis cleanly
- `npm run dev` in both directories starts without errors

---

## Phase 2 — Backend Core: API + DB + Queue

### Order of implementation

**Step 2.1 — Config & DB connection**
- [ ] `src/config/env.ts` — Zod-validated env vars
- [ ] `src/config/db.ts` — Mongoose connection with retry
- [ ] `src/config/redis.ts` — ioredis client singleton
- [ ] `src/utils/logger.ts` — Winston logger (dev: colorized, prod: JSON)

**Step 2.2 — Mongoose Models**
- [ ] `src/models/Assignment.model.ts` — full schema + indexes
- [ ] `src/models/QuestionPaper.model.ts` — full schema + indexes

**Step 2.3 — Services**
- [ ] `src/services/assignment.service.ts`
  - `create(data)` — insert document
  - `findById(id)` — with error on not found
  - `update(id, data)` — atomic update
  - `findAll(page, limit, status)` — paginated query
- [ ] `src/services/paper.service.ts`
  - `create(data)` — insert document
  - `findByAssignmentId(id)` — with cache check
- [ ] `src/services/cache.service.ts`
  - `get<T>(key)`, `set(key, value, ttl)`, `del(key)`
- [ ] `src/services/queue.service.ts`
  - `enqueueGeneration(assignmentId)` → returns jobId
  - `enqueuePDF(assignmentId)` → returns jobId (bonus)
  - `getJobStatus(jobId)` → status + progress

**Step 2.4 — Controllers + Routes**
- [ ] `src/controllers/assignment.controller.ts`
  - `create` — POST /assignments
  - `getById` — GET /assignments/:id
  - `getStatus` — GET /assignments/:id/status
  - `list` — GET /assignments
- [ ] `src/controllers/paper.controller.ts`
  - `getByAssignmentId` — GET /assignments/:id/paper
  - `regenerate` — POST /assignments/:id/regenerate
- [ ] `src/middleware/validate.ts` — Zod middleware wrapper
- [ ] `src/middleware/errorHandler.ts` — global error handler
- [ ] `src/middleware/rateLimiter.ts`
- [ ] `src/routes/` — wire controllers to Express Router
- [ ] `src/server.ts` — bootstrap Express, register routes, CORS, Helmet

### Verification
- POST /assignments with valid body → `201` + assignmentId
- POST /assignments with invalid body → `400` with field errors
- GET /assignments/:id → `200` with document

---

## Phase 3 — AI Integration

### Order of implementation

- [ ] `src/ai/promptBuilder.ts` — `PromptBuilder.build(assignment)` returns `{ system, user }`
- [ ] `src/ai/llmClient.ts` — `LLMClient.complete(prompt)` with provider switching
  - OpenAI adapter (primary)
  - Anthropic adapter (secondary)
  - Ollama adapter (optional)
- [ ] `src/ai/responseParser.ts` — Zod schema + `ResponseParser.parse(rawText)`
  - Handle markdown code fence stripping
  - Zod validation with descriptive error messages
- [ ] `src/workers/generation.worker.ts` — full BullMQ worker
  - Socket progress emission at each step
  - Retry on parse failure (max 2 attempts)
  - Update assignment status on success/failure
  - Cache result in Redis

### Test checklist
- [ ] Worker picks up job and calls LLM
- [ ] Parser handles valid JSON correctly
- [ ] Parser throws `LLM_PARSE_ERROR` for invalid JSON
- [ ] Parser throws `LLM_SCHEMA_ERROR` for invalid schema
- [ ] Worker emits correct WebSocket events at each stage
- [ ] Assignment status updated to `completed` after success

---

## Phase 4 — WebSocket Layer

- [ ] `src/socket/gateway.ts` — `SocketGateway` class with room management
- [ ] Integrate `SocketGateway` into `server.ts` (attach to HTTP server)
- [ ] Pass gateway instance to generation worker (dependency injection or singleton)
- [ ] Test: join room → enqueue job → receive all events in order

---

## Phase 5 — Frontend: Assignment Creation Form

### Order of implementation

**Step 5.1 — Foundation**
- [ ] `stores/assignmentStore.ts` — Zustand store
- [ ] `stores/generationStore.ts` — Zustand store
- [ ] `stores/paperStore.ts` — Zustand store
- [ ] `lib/socket.ts` — singleton Socket.io client
- [ ] `lib/api.ts` — Axios instance with base URL + error interceptor
- [ ] `validations/assignmentSchema.ts` — Zod schema
- [ ] `types/index.ts` — all shared TypeScript types

**Step 5.2 — UI Components**
- [ ] `components/forms/AssignmentForm.tsx` — main form wrapper
- [ ] `components/forms/FileUploadField.tsx` — react-dropzone PDF/text upload
- [ ] `components/forms/QuestionTypeSelector.tsx` — multi-select checkboxes
- [ ] `components/forms/DifficultyDistribution.tsx` — 3-slider that sums to 100

**Step 5.3 — Create Page**
- [ ] `app/create/page.tsx`
  - React Hook Form setup with Zod resolver
  - Call `POST /api/v1/assignments`
  - On success → store IDs in generationStore → navigate to `/assignments/:id/status`
  - Proper validation error messages inline

### UI Requirements
- Mobile responsive (Tailwind sm/md/lg breakpoints)
- No empty fields allowed
- No negative values for marks/questions
- Difficulty sliders must show live sum (highlight red if ≠ 100)
- File upload shows filename + remove button on selection

---

## Phase 6 — Frontend: Generation Status Screen

- [ ] `hooks/useAssignmentSocket.ts` — join room, handle all events
- [ ] `hooks/useGenerationStatus.ts` — polling fallback hook
- [ ] `components/common/ProgressBar.tsx` — animated progress bar
- [ ] `components/common/Spinner.tsx`
- [ ] `app/assignments/[id]/status/page.tsx`
  - Subscribe to WebSocket on mount
  - Show animated progress bar with stage label
  - Auto-navigate to `/paper` on `generation:completed`
  - Show error state + "Try Regenerating" button on `generation:failed`
  - Poll `/status` every 5s as fallback if WebSocket disconnects

---

## Phase 7 — Frontend: Question Paper Output

**Step 7.1 — Components**
- [ ] `components/paper/StudentInfoSection.tsx`
  - Input lines for Name, Roll Number, Section
- [ ] `components/paper/DifficultyBadge.tsx`
  - Green = Easy, Yellow = Medium, Red = Hard
- [ ] `components/paper/QuestionCard.tsx`
  - Question number, text, marks, difficulty badge
  - MCQ options list (A, B, C, D)
- [ ] `components/paper/SectionBlock.tsx`
  - Section label (A/B/C), title, instruction
  - List of QuestionCards
- [ ] `components/paper/QuestionPaper.tsx`
  - Header: title, subject, due date, total marks
  - StudentInfoSection
  - All SectionBlocks
- [ ] `components/common/ActionBar.tsx`
  - "Regenerate" button → POST /regenerate → navigate back to status
  - "Download PDF" button (bonus)

**Step 7.2 — Output Page**
- [ ] `app/assignments/[id]/paper/page.tsx`
  - Fetch paper from `GET /api/v1/assignments/:id/paper`
  - Store in paperStore
  - Render QuestionPaper component
  - Render ActionBar

### UX Checklist
- [ ] Clean exam-paper-like layout (white card, proper spacing)
- [ ] Section headers visually distinct
- [ ] Difficulty badges color-coded
- [ ] Mobile responsive
- [ ] Loading skeleton while fetching
- [ ] Error state if paper not found

---

## Phase 8 — Bonus Features

### PDF Export
- [ ] `lib/pdf.ts` — `@react-pdf/renderer` template matching QuestionPaper layout
- [ ] `src/workers/pdf.worker.ts` — backend PDF generation (puppeteer or react-pdf)
- [ ] Wire up "Download PDF" button in ActionBar
- [ ] `GET /assignments/:id/pdf/download` endpoint

### Caching Improvements
- [ ] Redis TTL configurable via env var
- [ ] Cache hit logging (helps evaluate performance)
- [ ] Cache invalidation on regenerate confirmed

### UI Polish
- [ ] Smooth page transitions (Framer Motion or CSS transitions)
- [ ] Toast notifications (react-hot-toast) for success/error
- [ ] Assignment history page: list all past assignments

---

## Phase 9 — Testing, Polish & Deployment

### Pre-deployment checklist
- [ ] All TypeScript errors resolved (strict mode)
- [ ] API endpoints manually tested with Postman/Thunder Client
- [ ] WebSocket events verified end-to-end
- [ ] Mobile layout tested on 375px viewport
- [ ] `.env.example` files created for both projects
- [ ] `README.md` written (architecture overview + setup instructions)

### Deployment steps
1. **MongoDB Atlas** — create free cluster, get connection string
2. **Upstash Redis** — create free Redis instance, get URL + token
3. **Backend → Railway**
   - Connect GitHub repo
   - Set all env vars (MONGODB_URI, REDIS_URL, OPENAI_API_KEY, etc.)
   - Set start command: `npm run start`
4. **Frontend → Vercel**
   - Connect GitHub repo
   - Set `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_WS_URL` to Railway backend URL
   - Deploy

### README.md must include
- Project overview
- Architecture diagram (copy from HLD.md)
- Local setup instructions (docker-compose + env setup)
- Deployed links (Vercel + Railway)
- Tech stack table

---

## Critical Path (Minimum Viable Submission)

If time is very tight, prioritize in this order:

```
1. Backend: Assignment creation API → MongoDB save → BullMQ enqueue
2. AI worker: LLM call → parse → store paper → WebSocket emit  
3. Frontend form: submit → navigate to status screen
4. Frontend status screen: WebSocket listener → navigate to paper
5. Frontend paper page: fetch + render sections/questions
```

That covers 100% of the core requirements. Add bonus features only after this is working end-to-end.
