# Technology Stack
## VedaAI – AI Assessment Creator

---

## 1. Frontend

| Technology              | Version  | Role                              | Why This Choice                                                                                     |
|-------------------------|----------|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| **Next.js**             | 14+      | React framework, SSR/SSG          | Assignment-required. App Router enables server components; optimized for production deployments on Vercel |
| **TypeScript**          | 5+       | Static typing                     | Assignment-required. Catches bugs at compile time, improves DX significantly                       |
| **Zustand**             | 4+       | State management                  | Lighter than Redux for this scope. No boilerplate. Works great for 3 isolated stores (form, job, paper) |
| **Socket.io-client**    | 4+       | WebSocket client                  | Assignment-required. Matches the Socket.io server. Auto-reconnect + polling fallback built-in      |
| **React Hook Form**     | 7+       | Form management                   | Best-in-class performance — uncontrolled inputs, minimal re-renders. Integrates cleanly with Zod   |
| **Zod**                 | 3+       | Schema validation (frontend)      | Shared schema between FE validation and BE validation. Single source of truth for input rules      |
| **TailwindCSS**         | 3+       | Styling                           | Utility-first CSS. Rapid development, fully responsive, easy dark mode if needed                   |
| **shadcn/ui**           | latest   | UI component library              | Accessible, unstyled-first components. Perfectly compatible with Tailwind                          |
| **@react-pdf/renderer** | 3+       | PDF generation (bonus)            | Renders React components as PDF. Clean output formatting — not raw HTML print                      |
| **react-dropzone**      | 14+      | File upload UI                    | Simple drag-and-drop file input with type/size validation hooks                                    |
| **axios**               | 1+       | HTTP client                       | Interceptors make it easy to attach auth headers, handle errors globally                           |
| **lucide-react**        | latest   | Icons                             | Lightweight, consistent icon set. Works well with Tailwind                                         |

---

## 2. Backend

| Technology              | Version  | Role                              | Why This Choice                                                                                     |
|-------------------------|----------|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| **Node.js**             | 20 LTS   | Runtime                           | Assignment-required. Great async I/O for WS + queue management                                     |
| **Express**             | 4+       | HTTP framework                    | Assignment-required. Minimal, flexible, large ecosystem                                             |
| **TypeScript**          | 5+       | Static typing                     | Assignment-required. Catches worker/model mismatches at compile time                               |
| **Socket.io**           | 4+       | WebSocket server                  | Assignment-required. Room-based pub/sub out of the box. Scales via Redis adapter if needed          |
| **BullMQ**              | 4+       | Job queue                         | Assignment-required. Built on ioredis. Retry logic, priorities, concurrency built-in               |
| **ioredis**             | 5+       | Redis client                      | Best-in-class Redis client for Node. Supports clustering + TLS for production                      |
| **Mongoose**            | 8+       | MongoDB ODM                       | Schema validation, virtuals, and typed models via `mongoose-lean-types`                            |
| **Multer**              | 1+       | File upload middleware             | Streams file uploads directly. Easy integration with local disk or S3                              |
| **Zod**                 | 3+       | Request validation                | Same schema library as frontend. Eliminates duplicate validation logic                             |
| **Winston**             | 3+       | Structured logging                | JSON log output, log levels, file transport support for production                                  |
| **express-rate-limit**  | 7+       | Rate limiting                     | Simple IP-based rate limiter to protect the AI generation endpoint                                 |
| **cors**                | 2+       | CORS middleware                   | Allow frontend origin in dev/prod                                                                   |
| **helmet**              | 7+       | HTTP security headers             | Best-practice security headers (XSS, CSRF protection headers)                                      |
| **dotenv**              | 16+      | Environment config                | Standard .env file loading                                                                         |

---

## 3. AI / LLM

| Technology              | Notes                                                                                              |
|-------------------------|----------------------------------------------------------------------------------------------------|
| **OpenAI SDK** (`openai`) | Primary LLM provider. `gpt-4o-mini` recommended — JSON mode, fast, affordable                 |
| **Anthropic SDK**       | Alternative provider. `claude-3-haiku` for speed/cost                                             |
| **Ollama** (optional)   | Local model support. Use `llama3` or `mistral` for offline/free operation                         |
| **JSON Mode**           | All providers configured to return strict JSON (OpenAI: `response_format: json_object`)           |

---

## 4. Data Stores

| Technology              | Version  | Role                              | Why This Choice                                                                                     |
|-------------------------|----------|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| **MongoDB**             | 7+       | Primary database                  | Assignment-required. Flexible document model suits variable question paper structure                |
| **MongoDB Atlas**       | —        | Hosted MongoDB (production)       | Free tier available, easy setup, built-in backups                                                   |
| **Redis**               | 7+       | Cache + queue store               | Assignment-required. BullMQ backing store + fast result caching. Sub-millisecond reads             |
| **Upstash Redis**       | —        | Hosted Redis (production)         | Free tier available, serverless-compatible, HTTP + native Redis protocol                            |

---

## 5. Infrastructure & Deployment

| Technology              | Role                              | Notes                                                            |
|-------------------------|-----------------------------------|------------------------------------------------------------------|
| **Vercel**              | Frontend deployment               | Zero-config Next.js deployment. Free tier sufficient             |
| **Railway**             | Backend deployment                | Simple Node.js + Redis deployment. Supports WebSockets natively  |
| **Docker Compose**      | Local development                 | Run MongoDB + Redis locally without cloud accounts               |
| **GitHub Actions**      | CI (optional)                     | Lint + type-check on every push                                  |

---

## 6. Developer Tooling

| Tool                    | Purpose                                                         |
|-------------------------|-----------------------------------------------------------------|
| **ESLint**              | Linting with `eslint-config-next` + TypeScript rules            |
| **Prettier**            | Code formatting, enforced on save                               |
| **tsx / ts-node**       | Run TypeScript directly in development                          |
| **nodemon**             | Auto-restart backend on file changes                            |
| **concurrently**        | Run frontend + backend simultaneously in one terminal           |
| **@types/***            | Type definitions for all major libraries                        |

---

## 7. Quick Decision Summary

```
Frontend Framework   →  Next.js 14 (App Router)          — required
State Management     →  Zustand                           — simpler than Redux for this scope
Forms & Validation   →  React Hook Form + Zod             — best performance + shared schema
WebSocket Client     →  Socket.io-client                  — matches server, auto-reconnect
Styling              →  TailwindCSS + shadcn/ui            — fast development, accessible
PDF Export           →  @react-pdf/renderer               — proper PDF, not print-to-PDF

Backend Framework    →  Express + TypeScript              — required
Job Queue            →  BullMQ                            — required, best Redis-backed queue
Cache                →  Redis via ioredis                 — required
Database             →  MongoDB via Mongoose              — required
WebSocket Server     →  Socket.io                        — room-based, required
Validation           →  Zod                              — shared with frontend

LLM Provider         →  OpenAI gpt-4o-mini (default)     — fast, cheap, reliable JSON output
LLM Abstraction      →  Custom adapter pattern            — swap provider via env var

Deployment           →  Vercel (FE) + Railway (BE)       — free tiers, easy setup
Local Dev DB/Cache   →  Docker Compose                   — MongoDB + Redis in one command
```
