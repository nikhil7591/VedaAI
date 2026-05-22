# API Specification
## VedaAI – AI Assessment Creator

**Base URL:** `http://localhost:4000/api/v1`  
**Content-Type:** `application/json`  
**API Version:** `v1`

---

## 1. Assignments

### 1.1 Create Assignment
**Endpoint:** `POST /assignments`

Creates a new assignment, persists it to MongoDB, and enqueues an AI generation job.

**Request Body:**
```json
{
  "title": "Science Chapter 5 Test",
  "subject": "Physics",
  "dueDate": "2025-04-15T23:59:00.000Z",
  "totalMarks": 100,
  "totalQuestions": 20,
  "questionTypes": ["MCQ", "SHORT", "LONG"],
  "difficultyDistribution": {
    "easy": 30,
    "medium": 50,
    "hard": 20
  },
  "additionalInstructions": "Include numerical problems in the long answer section."
}
```

**Validation Rules:**
- `title` — required, min 3 chars
- `subject` — required, min 2 chars
- `dueDate` — required, must be a future ISO 8601 date
- `totalMarks` — required, integer, 1–500
- `totalQuestions` — required, integer, 1–100
- `questionTypes` — required, non-empty array of `["MCQ","SHORT","LONG","TRUE_FALSE"]`
- `difficultyDistribution.easy + medium + hard` — must equal 100

**Response: `201 Created`**
```json
{
  "success": true,
  "data": {
    "assignmentId": "663f1a2b4c1e2d3f5a6b7c8d",
    "jobId": "bullmq-job-001",
    "status": "queued"
  }
}
```

**Error Responses:**
| Status | Code                 | Description                      |
|--------|----------------------|----------------------------------|
| 400    | `VALIDATION_ERROR`   | Invalid or missing fields        |
| 500    | `INTERNAL_ERROR`     | Server or DB error               |

---

### 1.2 Get Assignment by ID
**Endpoint:** `GET /assignments/:id`

Returns assignment metadata and current job status.

**Path Params:**
- `id` — MongoDB ObjectId of the assignment

**Response: `200 OK`**
```json
{
  "success": true,
  "data": {
    "_id": "663f1a2b4c1e2d3f5a6b7c8d",
    "title": "Science Chapter 5 Test",
    "subject": "Physics",
    "dueDate": "2025-04-15T23:59:00.000Z",
    "totalMarks": 100,
    "totalQuestions": 20,
    "questionTypes": ["MCQ", "SHORT", "LONG"],
    "difficultyDistribution": { "easy": 30, "medium": 50, "hard": 20 },
    "additionalInstructions": "Include numerical problems...",
    "status": "completed",
    "jobId": "bullmq-job-001",
    "paperId": "663f1b3c5d2f3a4b6c7d8e9f",
    "createdAt": "2025-03-20T10:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Code             | Description                    |
|--------|------------------|--------------------------------|
| 404    | `NOT_FOUND`      | Assignment not found           |
| 400    | `INVALID_ID`     | Malformed MongoDB ObjectId     |

---

### 1.3 Get Assignment Job Status
**Endpoint:** `GET /assignments/:id/status`

Returns the current job processing state (used for polling fallback if WebSocket disconnects).

**Response: `200 OK`**
```json
{
  "success": true,
  "data": {
    "assignmentId": "663f1a2b4c1e2d3f5a6b7c8d",
    "jobId": "bullmq-job-001",
    "status": "processing",
    "progress": 65,
    "errorMessage": null
  }
}
```

**Status Values:**
| Value        | Meaning                               |
|--------------|---------------------------------------|
| `queued`     | Job waiting in BullMQ queue           |
| `processing` | Worker is actively calling LLM        |
| `completed`  | Paper generated and stored            |
| `failed`     | All retries exhausted, error logged   |

---

### 1.4 List All Assignments
**Endpoint:** `GET /assignments`

Returns a paginated list of all assignments (most recent first).

**Query Params:**
| Param    | Type    | Default | Description         |
|----------|---------|---------|---------------------|
| `page`   | integer | 1       | Page number         |
| `limit`  | integer | 10      | Items per page      |
| `status` | string  | —       | Filter by status    |

**Response: `200 OK`**
```json
{
  "success": true,
  "data": {
    "assignments": [ /* array of assignment objects */ ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

## 2. Question Papers

### 2.1 Get Generated Question Paper
**Endpoint:** `GET /assignments/:id/paper`

Returns the fully structured question paper. Checks Redis cache first, falls back to MongoDB.

**Response: `200 OK`**
```json
{
  "success": true,
  "data": {
    "_id": "663f1b3c5d2f3a4b6c7d8e9f",
    "assignmentId": "663f1a2b4c1e2d3f5a6b7c8d",
    "title": "Science Chapter 5 Test",
    "subject": "Physics",
    "dueDate": "2025-04-15T23:59:00.000Z",
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
            "text": "Which of the following is the SI unit of force?",
            "type": "MCQ",
            "difficulty": "easy",
            "marks": 2,
            "options": ["Joule", "Newton", "Watt", "Pascal"]
          }
        ]
      },
      {
        "sectionLabel": "B",
        "title": "Short Answer Questions",
        "instruction": "Attempt any 5 questions. Each carries 6 marks.",
        "totalMarks": 30,
        "questions": [
          {
            "questionNumber": 11,
            "text": "Explain Newton's Second Law of Motion with an example.",
            "type": "SHORT",
            "difficulty": "medium",
            "marks": 6,
            "options": []
          }
        ]
      }
    ],
    "metadata": {
      "generatedAt": "2025-03-20T10:05:23.000Z",
      "llmModel": "gpt-4o-mini"
    }
  }
}
```

**Error Responses:**
| Status | Code             | Description                                   |
|--------|------------------|-----------------------------------------------|
| 404    | `NOT_FOUND`      | Assignment or paper not found                 |
| 409    | `NOT_READY`      | Generation still in progress                  |

---

### 2.2 Regenerate Question Paper
**Endpoint:** `POST /assignments/:id/regenerate`

Discards the existing paper and re-enqueues a fresh generation job. Clears Redis cache.

**Request Body:** _(empty or optional config overrides)_
```json
{
  "additionalInstructions": "Make the questions more conceptual."
}
```

**Response: `202 Accepted`**
```json
{
  "success": true,
  "data": {
    "assignmentId": "663f1a2b4c1e2d3f5a6b7c8d",
    "jobId": "bullmq-job-002",
    "message": "Regeneration job queued"
  }
}
```

---

## 3. PDF Export (Bonus)

### 3.1 Request PDF Generation
**Endpoint:** `POST /assignments/:id/pdf`

Triggers a PDF generation job. Returns a jobId to poll or listen on WebSocket.

**Response: `202 Accepted`**
```json
{
  "success": true,
  "data": {
    "pdfJobId": "bullmq-pdf-001",
    "message": "PDF generation started"
  }
}
```

---

### 3.2 Download PDF
**Endpoint:** `GET /assignments/:id/pdf/download`

Streams the generated PDF file.

**Response: `200 OK`**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="science-chapter-5-test.pdf"`

**Error Responses:**
| Status | Code           | Description                    |
|--------|----------------|--------------------------------|
| 404    | `NOT_FOUND`    | PDF not yet generated          |
| 409    | `NOT_READY`    | PDF generation in progress     |

---

## 4. File Upload (Optional)

### 4.1 Upload Assignment File
**Endpoint:** `POST /assignments/:id/upload`

Uploads a PDF or text file to supplement the assignment context.

**Request:** `multipart/form-data`
- `file` — PDF (max 10MB) or .txt (max 1MB)

**Response: `200 OK`**
```json
{
  "success": true,
  "data": {
    "fileKey": "uploads/663f1a2b4c1e2d3f5a6b7c8d/context.pdf",
    "fileSize": 204800,
    "mimeType": "application/pdf"
  }
}
```

---

## 5. Error Response Format

All error responses follow this structure:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Difficulty distribution must total 100%",
    "details": [
      {
        "field": "difficultyDistribution",
        "message": "easy + medium + hard must equal 100"
      }
    ]
  }
}
```

---

## 6. HTTP Status Code Reference

| Code | Meaning                                        |
|------|------------------------------------------------|
| 200  | Success                                        |
| 201  | Resource created                               |
| 202  | Accepted (async job queued)                    |
| 400  | Bad request / validation error                 |
| 404  | Resource not found                             |
| 409  | Conflict (e.g., paper not ready yet)           |
| 429  | Too many requests (rate limit hit)             |
| 500  | Internal server error                          |

---

## 7. Rate Limiting

- `POST /assignments` — 10 requests / 15 min per IP
- `POST /assignments/:id/regenerate` — 5 requests / 15 min per IP
- All other endpoints — 100 requests / 15 min per IP
