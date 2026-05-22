# Low-Level Design (LLD)
## VedaAI – AI Assessment Creator

---

## 1. Project Structure

```
veda-ai/
├── frontend/                        # Next.js App
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Redirect → /create
│   │   ├── create/
│   │   │   └── page.tsx             # Assignment Creation Form
│   │   └── assignments/
│   │       └── [id]/
│   │           ├── status/
│   │           │   └── page.tsx     # Job progress screen
│   │           └── paper/
│   │               └── page.tsx     # Question paper output
│   ├── components/
│   │   ├── forms/
│   │   │   ├── AssignmentForm.tsx
│   │   │   ├── FileUploadField.tsx
│   │   │   ├── QuestionTypeSelector.tsx
│   │   │   └── DifficultyDistribution.tsx
│   │   ├── paper/
│   │   │   ├── QuestionPaper.tsx
│   │   │   ├── SectionBlock.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── DifficultyBadge.tsx
│   │   │   └── StudentInfoSection.tsx
│   │   ├── ui/                      # shadcn/ui components
│   │   └── common/
│   │       ├── Spinner.tsx
│   │       ├── ProgressBar.tsx
│   │       └── ActionBar.tsx
│   ├── stores/
│   │   ├── assignmentStore.ts       # Zustand: form state
│   │   ├── generationStore.ts       # Zustand: job status + progress
│   │   └── paperStore.ts            # Zustand: generated paper
│   ├── lib/
│   │   ├── socket.ts                # Socket.io client singleton
│   │   ├── api.ts                   # Axios instance + API helpers
│   │   └── pdf.ts                   # @react-pdf/renderer export
│   ├── hooks/
│   │   ├── useAssignmentSocket.ts   # WS subscription hook
│   │   └── useGenerationStatus.ts
│   ├── types/
│   │   └── index.ts                 # Shared TypeScript types
│   └── validations/
│       └── assignmentSchema.ts      # Zod schema for form
│
├── backend/                         # Express App
│   ├── src/
│   │   ├── server.ts                # Express + Socket.io bootstrap
│   │   ├── config/
│   │   │   ├── db.ts                # Mongoose connect
│   │   │   ├── redis.ts             # ioredis client
│   │   │   └── env.ts               # Validated env vars (Zod)
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── assignment.routes.ts
│   │   │   └── paper.routes.ts
│   │   ├── controllers/
│   │   │   ├── assignment.controller.ts
│   │   │   └── paper.controller.ts
│   │   ├── services/
│   │   │   ├── assignment.service.ts
│   │   │   ├── paper.service.ts
│   │   │   ├── queue.service.ts     # BullMQ producer
│   │   │   └── cache.service.ts     # Redis get/set helpers
│   │   ├── workers/
│   │   │   ├── generation.worker.ts # BullMQ consumer — LLM call
│   │   │   └── pdf.worker.ts        # BullMQ consumer — PDF render
│   │   ├── ai/
│   │   │   ├── promptBuilder.ts
│   │   │   ├── llmClient.ts         # Abstracted LLM interface
│   │   │   └── responseParser.ts    # Zod parse + transform
│   │   ├── models/
│   │   │   ├── Assignment.model.ts
│   │   │   └── QuestionPaper.model.ts
│   │   ├── socket/
│   │   │   └── gateway.ts           # Socket.io room + emit helpers
│   │   ├── middleware/
│   │   │   ├── validate.ts          # Zod request validation
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   └── utils/
│   │       ├── logger.ts            # Winston logger
│   │       └── asyncHandler.ts
│   ├── tsconfig.json
│   └── package.json
│
└── docker-compose.yml               # Local MongoDB + Redis
```

---

## 2. Frontend — Module Detail

### 2.1 Zustand Stores

#### `assignmentStore.ts`
```typescript
interface AssignmentState {
  title: string;
  subject: string;
  dueDate: string;
  totalMarks: number;
  totalQuestions: number;
  questionTypes: QuestionType[];          // MCQ | Short | Long | TrueFalse
  difficultyDistribution: {
    easy: number;      // percentage
    medium: number;
    hard: number;
  };
  additionalInstructions: string;
  uploadedFile: File | null;             // optional PDF/text
  // Actions
  setField: (key, value) => void;
  reset: () => void;
}
```

#### `generationStore.ts`
```typescript
interface GenerationState {
  assignmentId: string | null;
  jobId: string | null;
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;                      // 0–100
  errorMessage: string | null;
  setStatus: (status, progress?, error?) => void;
  setIds: (assignmentId, jobId) => void;
}
```

#### `paperStore.ts`
```typescript
interface PaperState {
  paper: QuestionPaper | null;
  isLoading: boolean;
  setPaper: (paper: QuestionPaper) => void;
  clearPaper: () => void;
}
```

---

### 2.2 WebSocket Hook

```typescript
// hooks/useAssignmentSocket.ts
export function useAssignmentSocket(assignmentId: string) {
  const { setStatus } = useGenerationStore();
  const router = useRouter();

  useEffect(() => {
    const socket = getSocket();           // singleton from lib/socket.ts
    socket.emit('join', { assignmentId });

    socket.on('generation:started',   () => setStatus('processing', 5));
    socket.on('generation:progress',  ({ percent }) => setStatus('processing', percent));
    socket.on('generation:completed', ({ paperId }) => {
      setStatus('completed', 100);
      router.push(`/assignments/${assignmentId}/paper`);
    });
    socket.on('generation:failed',    ({ message }) => setStatus('failed', 0, message));

    return () => {
      socket.emit('leave', { assignmentId });
      socket.off('generation:started');
      socket.off('generation:progress');
      socket.off('generation:completed');
      socket.off('generation:failed');
    };
  }, [assignmentId]);
}
```

---

### 2.3 Form Validation Schema (Zod)

```typescript
// validations/assignmentSchema.ts
export const assignmentSchema = z.object({
  title:          z.string().min(3, 'Title must be at least 3 characters'),
  subject:        z.string().min(2),
  dueDate:        z.string().refine(d => new Date(d) > new Date(), 'Due date must be in the future'),
  totalMarks:     z.number().positive('Marks must be positive').max(500),
  totalQuestions: z.number().int().min(1).max(100),
  questionTypes:  z.array(z.enum(['MCQ','SHORT','LONG','TRUE_FALSE'])).min(1),
  difficultyDistribution: z.object({
    easy:   z.number().min(0).max(100),
    medium: z.number().min(0).max(100),
    hard:   z.number().min(0).max(100),
  }).refine(d => d.easy + d.medium + d.hard === 100, 'Must total 100%'),
  additionalInstructions: z.string().optional(),
});
```

---

## 3. Backend — Module Detail

### 3.1 MongoDB Models

#### `Assignment.model.ts`
```typescript
const AssignmentSchema = new Schema({
  title:          { type: String, required: true },
  subject:        { type: String, required: true },
  dueDate:        { type: Date,   required: true },
  totalMarks:     { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  questionTypes:  [{ type: String, enum: ['MCQ','SHORT','LONG','TRUE_FALSE'] }],
  difficultyDistribution: {
    easy:   Number,
    medium: Number,
    hard:   Number,
  },
  additionalInstructions: String,
  fileKey:        String,        // S3/local path to uploaded file (optional)
  status:         { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
  jobId:          String,
  paperId:        { type: Schema.Types.ObjectId, ref: 'QuestionPaper' },
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now },
});
```

#### `QuestionPaper.model.ts`
```typescript
const QuestionSchema = new Schema({
  questionNumber: Number,
  text:           { type: String, required: true },
  type:           { type: String, enum: ['MCQ','SHORT','LONG','TRUE_FALSE'] },
  difficulty:     { type: String, enum: ['easy','medium','hard'] },
  marks:          { type: Number, required: true },
  options:        [String],          // for MCQ
  answer:         String,            // optional model answer
});

const SectionSchema = new Schema({
  sectionLabel:   String,            // "A", "B", "C"
  title:          String,            // "Multiple Choice Questions"
  instruction:    String,            // "Attempt all questions"
  totalMarks:     Number,
  questions:      [QuestionSchema],
});

const QuestionPaperSchema = new Schema({
  assignmentId:   { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  title:          String,
  subject:        String,
  dueDate:        Date,
  totalMarks:     Number,
  sections:       [SectionSchema],
  metadata: {
    generatedAt:  Date,
    llmModel:     String,
    promptTokens: Number,
    totalTokens:  Number,
  },
  createdAt:      { type: Date, default: Date.now },
});
```

---

### 3.2 BullMQ Worker — Generation Flow

```typescript
// workers/generation.worker.ts
export const generationWorker = new Worker(
  'questionGeneration',
  async (job: Job<GenerationJobData>) => {
    const { assignmentId } = job.data;
    const socketGateway = getSocketGateway();

    // Step 1 — Notify start
    await socketGateway.emit(assignmentId, 'generation:started', {});
    await job.updateProgress(5);

    // Step 2 — Fetch assignment from DB
    const assignment = await AssignmentService.findById(assignmentId);

    // Step 3 — Build prompt
    const prompt = PromptBuilder.build(assignment);
    await job.updateProgress(15);

    // Step 4 — Call LLM
    const rawResponse = await LLMClient.complete(prompt);
    await job.updateProgress(70);

    // Step 5 — Parse & validate
    const parsed = ResponseParser.parse(rawResponse);  // throws on invalid
    await job.updateProgress(85);

    // Step 6 — Store paper
    const paper = await QuestionPaperService.create({
      assignmentId,
      ...parsed,
      metadata: { generatedAt: new Date(), llmModel: rawResponse.model }
    });
    await job.updateProgress(95);

    // Step 7 — Update assignment status
    await AssignmentService.update(assignmentId, { status: 'completed', paperId: paper._id });

    // Step 8 — Cache result
    await CacheService.set(`paper:${assignmentId}`, paper, 3600);

    // Step 9 — Notify completion
    await socketGateway.emit(assignmentId, 'generation:completed', { paperId: paper._id });
    await job.updateProgress(100);

    return { paperId: paper._id };
  },
  {
    connection: redisClient,
    concurrency: 5,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  }
);
```

---

### 3.3 AI — Prompt Builder

```typescript
// ai/promptBuilder.ts
export class PromptBuilder {
  static build(assignment: IAssignment): LLMPrompt {
    const systemPrompt = `
You are an expert educator generating structured exam question papers.
You MUST respond with ONLY valid JSON matching the schema below. No markdown, no explanation.

Schema:
{
  "title": string,
  "sections": [
    {
      "sectionLabel": "A" | "B" | "C" ...,
      "title": string,
      "instruction": string,
      "questions": [
        {
          "questionNumber": number,
          "text": string,
          "type": "MCQ" | "SHORT" | "LONG" | "TRUE_FALSE",
          "difficulty": "easy" | "medium" | "hard",
          "marks": number,
          "options": string[]   // only for MCQ, 4 options
        }
      ]
    }
  ]
}
`;

    const userPrompt = `
Generate a question paper with the following configuration:
- Subject: ${assignment.subject}
- Title: ${assignment.title}
- Total Questions: ${assignment.totalQuestions}
- Total Marks: ${assignment.totalMarks}
- Question Types: ${assignment.questionTypes.join(', ')}
- Difficulty Distribution: Easy ${assignment.difficultyDistribution.easy}%, Medium ${assignment.difficultyDistribution.medium}%, Hard ${assignment.difficultyDistribution.hard}%
- Additional Instructions: ${assignment.additionalInstructions || 'None'}

Group questions into logical sections (e.g., Section A: MCQs, Section B: Short Answer, etc.).
Each section must have a clear title and instruction line.
Distribute marks proportionally by difficulty.
`;

    return { system: systemPrompt, user: userPrompt };
  }
}
```

---

### 3.4 Socket Gateway

```typescript
// socket/gateway.ts
export class SocketGateway {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.registerHandlers();
  }

  private registerHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('join',  ({ assignmentId }) => socket.join(`assignment:${assignmentId}`));
      socket.on('leave', ({ assignmentId }) => socket.leave(`assignment:${assignmentId}`));
    });
  }

  async emit(assignmentId: string, event: string, data: object) {
    this.io.to(`assignment:${assignmentId}`).emit(event, data);
  }
}
```

---

### 3.5 Response Parser (Zod)

```typescript
// ai/responseParser.ts
const QuestionSchema = z.object({
  questionNumber: z.number(),
  text:           z.string().min(5),
  type:           z.enum(['MCQ', 'SHORT', 'LONG', 'TRUE_FALSE']),
  difficulty:     z.enum(['easy', 'medium', 'hard']),
  marks:          z.number().positive(),
  options:        z.array(z.string()).length(4).optional(),
});

const SectionSchema = z.object({
  sectionLabel: z.string(),
  title:        z.string(),
  instruction:  z.string(),
  questions:    z.array(QuestionSchema).min(1),
});

const PaperSchema = z.object({
  title:    z.string(),
  sections: z.array(SectionSchema).min(1),
});

export class ResponseParser {
  static parse(rawResponse: string): z.infer<typeof PaperSchema> {
    let json: unknown;
    try {
      // Strip potential markdown code fences
      const cleaned = rawResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      json = JSON.parse(cleaned);
    } catch {
      throw new Error('LLM response is not valid JSON');
    }
    return PaperSchema.parse(json);   // throws ZodError with details on invalid
  }
}
```

---

### 3.6 Cache Service

```typescript
// services/cache.service.ts
export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(`veda:${key}`);
    return raw ? JSON.parse(raw) : null;
  }

  static async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    await redis.setex(`veda:${key}`, ttlSeconds, JSON.stringify(value));
  }

  static async del(key: string): Promise<void> {
    await redis.del(`veda:${key}`);
  }
}
```

---

## 4. Error Handling Strategy

| Layer       | Approach                                                                    |
|-------------|-----------------------------------------------------------------------------|
| Frontend    | React Hook Form field errors + toast notifications for API errors           |
| API Routes  | Zod validation middleware → 400 with field errors                           |
| Worker      | BullMQ retry (3x exponential) → emit `generation:failed` after exhaustion  |
| LLM Parse   | ZodError caught → job marked failed → error message surfaced to client     |
| MongoDB     | Mongoose validation as last-resort catch                                    |
| Global      | Express `errorHandler` middleware → structured JSON error responses         |

---

## 5. Environment Variables

```env
# Backend
PORT=4000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
```
