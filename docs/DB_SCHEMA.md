# Database Schema
## VedaAI – AI Assessment Creator

---

## 1. MongoDB Collections

### 1.1 `assignments`

Stores the teacher's assignment configuration and generation job state.

```
┌──────────────────────────────────────────────────────────────────┐
│  Collection: assignments                                         │
├──────────────────┬───────────────────┬───────────────────────────┤
│  Field           │  Type             │  Notes                    │
├──────────────────┼───────────────────┼───────────────────────────┤
│  _id             │  ObjectId         │  Auto-generated PK        │
│  title           │  String           │  Required, min 3 chars    │
│  subject         │  String           │  Required                 │
│  dueDate         │  Date             │  Required, future date    │
│  totalMarks      │  Number           │  Required, 1–500          │
│  totalQuestions  │  Number           │  Required, 1–100          │
│  questionTypes   │  String[]         │  MCQ|SHORT|LONG|TRUE_FALSE│
│  difficultyDist  │  Object           │  { easy, medium, hard }   │
│  ↳ easy          │  Number           │  Percentage 0–100         │
│  ↳ medium        │  Number           │  Percentage 0–100         │
│  ↳ hard          │  Number           │  Percentage 0–100         │
│  additionalInst  │  String           │  Optional teacher notes   │
│  fileKey         │  String           │  Optional upload path     │
│  status          │  String (enum)    │  pending|processing|      │
│                  │                   │  completed|failed         │
│  jobId           │  String           │  BullMQ job ID            │
│  paperId         │  ObjectId (ref)   │  → question_papers._id    │
│  createdAt       │  Date             │  Auto                     │
│  updatedAt       │  Date             │  Auto                     │
└──────────────────┴───────────────────┴───────────────────────────┘
```

**Mongoose Schema:**
```typescript
const AssignmentSchema = new Schema(
  {
    title:          { type: String,   required: true, minlength: 3 },
    subject:        { type: String,   required: true },
    dueDate:        { type: Date,     required: true },
    totalMarks:     { type: Number,   required: true, min: 1, max: 500 },
    totalQuestions: { type: Number,   required: true, min: 1, max: 100 },
    questionTypes:  [{ type: String,  enum: ['MCQ','SHORT','LONG','TRUE_FALSE'] }],
    difficultyDistribution: {
      easy:   { type: Number, min: 0, max: 100 },
      medium: { type: Number, min: 0, max: 100 },
      hard:   { type: Number, min: 0, max: 100 },
    },
    additionalInstructions: { type: String, default: '' },
    fileKey:  { type: String },
    status:   { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
    jobId:    { type: String },
    paperId:  { type: Schema.Types.ObjectId, ref: 'QuestionPaper' },
  },
  { timestamps: true }
);
```

**Indexes:**
```typescript
AssignmentSchema.index({ status: 1, createdAt: -1 });  // List queries
AssignmentSchema.index({ jobId: 1 });                   // Job status lookup
```

---

### 1.2 `question_papers`

Stores the fully structured AI-generated question paper.

```
┌──────────────────────────────────────────────────────────────────┐
│  Collection: question_papers                                     │
├──────────────────┬───────────────────┬───────────────────────────┤
│  Field           │  Type             │  Notes                    │
├──────────────────┼───────────────────┼───────────────────────────┤
│  _id             │  ObjectId         │  Auto-generated PK        │
│  assignmentId    │  ObjectId (ref)   │  → assignments._id        │
│  title           │  String           │  Paper title              │
│  subject         │  String           │  Subject name             │
│  dueDate         │  Date             │  From assignment          │
│  totalMarks      │  Number           │  Sum of all marks         │
│  sections        │  Section[]        │  Array of sections        │
│  metadata        │  Object           │  LLM generation info      │
│  ↳ generatedAt   │  Date             │                           │
│  ↳ llmModel      │  String           │  e.g. gpt-4o-mini         │
│  ↳ promptTokens  │  Number           │  Optional                 │
│  ↳ totalTokens   │  Number           │  Optional                 │
│  pdfUrl          │  String           │  Optional, after export   │
│  createdAt       │  Date             │  Auto                     │
└──────────────────┴───────────────────┴───────────────────────────┘

Section Subdocument:
┌──────────────────┬───────────────────┬───────────────────────────┐
│  sectionLabel    │  String           │  "A", "B", "C"            │
│  title           │  String           │  "Multiple Choice"        │
│  instruction     │  String           │  "Attempt all questions"  │
│  totalMarks      │  Number           │  Sum of section marks     │
│  questions       │  Question[]       │  Array of questions       │
└──────────────────┴───────────────────┴───────────────────────────┘

Question Subdocument:
┌──────────────────┬───────────────────┬───────────────────────────┐
│  questionNumber  │  Number           │  Sequential number        │
│  text            │  String           │  Question body text       │
│  type            │  String (enum)    │  MCQ|SHORT|LONG|TRUE_FALSE│
│  difficulty      │  String (enum)    │  easy|medium|hard         │
│  marks           │  Number           │  Marks for this question  │
│  options         │  String[]         │  MCQ options (4 items)    │
│  answer          │  String           │  Optional model answer    │
└──────────────────┴───────────────────┴───────────────────────────┘
```

**Mongoose Schema:**
```typescript
const QuestionSchema = new Schema({
  questionNumber: { type: Number },
  text:           { type: String, required: true },
  type:           { type: String, enum: ['MCQ','SHORT','LONG','TRUE_FALSE'] },
  difficulty:     { type: String, enum: ['easy','medium','hard'] },
  marks:          { type: Number, required: true, min: 0 },
  options:        [{ type: String }],
  answer:         { type: String },
}, { _id: false });

const SectionSchema = new Schema({
  sectionLabel: { type: String },
  title:        { type: String },
  instruction:  { type: String },
  totalMarks:   { type: Number },
  questions:    [QuestionSchema],
}, { _id: false });

const QuestionPaperSchema = new Schema(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    title:        { type: String },
    subject:      { type: String },
    dueDate:      { type: Date },
    totalMarks:   { type: Number },
    sections:     [SectionSchema],
    metadata: {
      generatedAt:  { type: Date },
      llmModel:     { type: String },
      promptTokens: { type: Number },
      totalTokens:  { type: Number },
    },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);
```

**Indexes:**
```typescript
QuestionPaperSchema.index({ assignmentId: 1 }, { unique: true });  // One paper per assignment
```

---

## 2. Redis Key Patterns

All keys are namespaced under `veda:` to avoid collisions.

| Key Pattern                          | Type   | TTL      | Purpose                                    |
|--------------------------------------|--------|----------|--------------------------------------------|
| `veda:paper:{assignmentId}`          | String | 3600s    | Cached serialized QuestionPaper JSON       |
| `veda:job:{jobId}:status`            | String | 86400s   | BullMQ job state (queued/processing/done)  |
| `veda:job:{jobId}:progress`          | String | 86400s   | Job progress 0–100                         |
| `veda:ratelimit:{ip}:create`         | String | 900s     | Rate limit counter for POST /assignments   |
| `bull:questionGeneration:*`          | —      | managed  | BullMQ internal queue keys                 |
| `bull:pdfGeneration:*`               | —      | managed  | BullMQ PDF queue internal keys             |

**Cache Invalidation Triggers:**
- On `POST /assignments/:id/regenerate` → delete `veda:paper:{assignmentId}`
- On paper update → delete `veda:paper:{assignmentId}`

---

## 3. Relationships

```
assignments (1) ──────────────── (1) question_papers
     │                                      │
     │  _id ←───────────────── assignmentId │
     │                                      │
     └── paperId ──────────────────── _id ──┘
```

---

## 4. Data Lifecycle

```
1. Teacher submits form
   └── assignments doc created  (status: "pending")

2. Job queued in BullMQ
   └── assignments.jobId set
   └── Redis: veda:job:{jobId}:status = "queued"

3. Worker starts
   └── assignments.status = "processing"
   └── Redis: veda:job:{jobId}:progress updated incrementally

4. Worker completes
   └── question_papers doc created
   └── assignments.status = "completed"
   └── assignments.paperId = paper._id
   └── Redis: veda:paper:{assignmentId} = serialized paper (TTL 1hr)

5. Teacher views paper
   └── Cache hit → serve from Redis
   └── Cache miss → query MongoDB, re-cache

6. Regeneration triggered
   └── Redis cache deleted
   └── assignments.status = "processing" again
   └── new job enqueued
   └── old question_papers doc replaced
```

---

## 5. Sample Documents

### assignments doc
```json
{
  "_id": "663f1a2b4c1e2d3f5a6b7c8d",
  "title": "Science Chapter 5 Test",
  "subject": "Physics",
  "dueDate": "2025-04-15T23:59:00.000Z",
  "totalMarks": 100,
  "totalQuestions": 20,
  "questionTypes": ["MCQ", "SHORT", "LONG"],
  "difficultyDistribution": { "easy": 30, "medium": 50, "hard": 20 },
  "additionalInstructions": "Include numerical problems.",
  "fileKey": null,
  "status": "completed",
  "jobId": "bullmq-job-001",
  "paperId": "663f1b3c5d2f3a4b6c7d8e9f",
  "createdAt": "2025-03-20T10:00:00.000Z",
  "updatedAt": "2025-03-20T10:05:30.000Z"
}
```

### question_papers doc
```json
{
  "_id": "663f1b3c5d2f3a4b6c7d8e9f",
  "assignmentId": "663f1a2b4c1e2d3f5a6b7c8d",
  "title": "Science Chapter 5 Test",
  "subject": "Physics",
  "totalMarks": 100,
  "sections": [
    {
      "sectionLabel": "A",
      "title": "Multiple Choice Questions",
      "instruction": "Attempt all questions. Each question carries 2 marks.",
      "totalMarks": 20,
      "questions": [
        {
          "questionNumber": 1,
          "text": "Which is the SI unit of force?",
          "type": "MCQ",
          "difficulty": "easy",
          "marks": 2,
          "options": ["Joule", "Newton", "Watt", "Pascal"]
        }
      ]
    }
  ],
  "metadata": {
    "generatedAt": "2025-03-20T10:05:23.000Z",
    "llmModel": "gpt-4o-mini",
    "promptTokens": 450,
    "totalTokens": 1820
  },
  "createdAt": "2025-03-20T10:05:23.000Z"
}
```
