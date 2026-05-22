# AI Prompt Design
## VedaAI – AI Assessment Creator

---

## 1. Design Principles

1. **Structured output only** — The LLM is always instructed to return strict JSON. The frontend never renders raw AI text.
2. **Schema-first** — The output schema is defined in Zod and embedded in the system prompt as a JSON template.
3. **Prompt + Parse separation** — `PromptBuilder` constructs the prompt; `ResponseParser` validates the output. They never mix concerns.
4. **Retry on parse failure** — If parsing fails, the worker retries the LLM call up to 2 times with a clarifying message before marking the job failed.
5. **Model agnostic** — The `LLMClient` interface abstracts over OpenAI, Anthropic, and Ollama, swappable via environment variable.

---

## 2. System Prompt

```
You are an expert educator and examination paper creator.
Your task is to generate a structured question paper based on the teacher's configuration.

CRITICAL RULES:
1. Respond with ONLY valid JSON. No markdown code fences, no explanations, no extra text.
2. Follow the exact JSON schema provided below.
3. Never include any content outside the JSON object.
4. Ensure all marks add up correctly across sections.
5. Distribute difficulty levels as closely as possible to the requested percentages.
6. Group questions into sections by question type (e.g., Section A: MCQ, Section B: Short Answer).
7. Each section must have a sectionLabel (A, B, C...), title, instruction, and a questions array.
8. For MCQ questions, always provide exactly 4 options.

REQUIRED JSON SCHEMA:
{
  "title": "<paper title>",
  "sections": [
    {
      "sectionLabel": "<A | B | C ...>",
      "title": "<section name>",
      "instruction": "<instruction for this section>",
      "questions": [
        {
          "questionNumber": <integer>,
          "text": "<question text>",
          "type": "<MCQ | SHORT | LONG | TRUE_FALSE>",
          "difficulty": "<easy | medium | hard>",
          "marks": <integer>,
          "options": ["<option1>", "<option2>", "<option3>", "<option4>"]
        }
      ]
    }
  ]
}

NOTE: The "options" field is ONLY required for MCQ questions. Omit it for other types.
```

---

## 3. User Prompt Template

```typescript
export function buildUserPrompt(assignment: IAssignment): string {
  const easyCount   = Math.round(assignment.totalQuestions * assignment.difficultyDistribution.easy   / 100);
  const mediumCount = Math.round(assignment.totalQuestions * assignment.difficultyDistribution.medium / 100);
  const hardCount   = assignment.totalQuestions - easyCount - mediumCount;

  const marksPerQuestion = Math.floor(assignment.totalMarks / assignment.totalQuestions);

  return `
Generate a complete question paper with the following configuration:

PAPER DETAILS:
- Title: "${assignment.title}"
- Subject: ${assignment.subject}
- Total Questions: ${assignment.totalQuestions}
- Total Marks: ${assignment.totalMarks}
- Marks per question (approximate): ${marksPerQuestion}

QUESTION TYPES TO INCLUDE:
${assignment.questionTypes.map(t => `- ${t}`).join('\n')}

DIFFICULTY DISTRIBUTION:
- Easy: ${assignment.difficultyDistribution.easy}% (approximately ${easyCount} questions)
- Medium: ${assignment.difficultyDistribution.medium}% (approximately ${mediumCount} questions)  
- Hard: ${assignment.difficultyDistribution.hard}% (approximately ${hardCount} questions)

SECTION ORGANIZATION:
- Create one section per question type
- Label sections A, B, C, etc.
- Write a meaningful instruction for each section

ADDITIONAL TEACHER INSTRUCTIONS:
${assignment.additionalInstructions || 'None'}

Generate the question paper now as a JSON object only.
`;
}
```

---

## 4. Full Prompt Example

**Input Assignment:**
```json
{
  "subject": "Physics",
  "title": "Chapter 5: Laws of Motion",
  "totalQuestions": 10,
  "totalMarks": 50,
  "questionTypes": ["MCQ", "SHORT"],
  "difficultyDistribution": { "easy": 40, "medium": 40, "hard": 20 },
  "additionalInstructions": "Include real-world application problems."
}
```

**Expected LLM Output:**
```json
{
  "title": "Chapter 5: Laws of Motion",
  "sections": [
    {
      "sectionLabel": "A",
      "title": "Multiple Choice Questions",
      "instruction": "Choose the correct answer for each question. Each question carries 3 marks.",
      "questions": [
        {
          "questionNumber": 1,
          "text": "A ball is thrown vertically upward. At the highest point, its velocity is:",
          "type": "MCQ",
          "difficulty": "easy",
          "marks": 3,
          "options": ["Maximum", "Zero", "Minimum but not zero", "Equal to initial velocity"]
        },
        {
          "questionNumber": 2,
          "text": "Newton's first law of motion is also known as the law of:",
          "type": "MCQ",
          "difficulty": "easy",
          "marks": 3,
          "options": ["Gravitation", "Inertia", "Conservation", "Acceleration"]
        },
        {
          "questionNumber": 3,
          "text": "A 5 kg object accelerates at 2 m/s². What is the net force acting on it?",
          "type": "MCQ",
          "difficulty": "medium",
          "marks": 3,
          "options": ["2.5 N", "5 N", "10 N", "15 N"]
        }
      ]
    },
    {
      "sectionLabel": "B",
      "title": "Short Answer Questions",
      "instruction": "Answer each question in 3–5 sentences. Each question carries 8 marks.",
      "questions": [
        {
          "questionNumber": 4,
          "text": "A car brakes suddenly on a wet road. Using Newton's laws, explain why the passengers jerk forward.",
          "type": "SHORT",
          "difficulty": "medium",
          "marks": 8
        },
        {
          "questionNumber": 5,
          "text": "Derive the equation F = ma from Newton's Second Law and explain each term with a real-world example.",
          "type": "SHORT",
          "difficulty": "hard",
          "marks": 8
        }
      ]
    }
  ]
}
```

---

## 5. Response Parser

```typescript
// ai/responseParser.ts
import { z } from 'zod';

const QuestionZodSchema = z.object({
  questionNumber: z.number().int().positive(),
  text:           z.string().min(5, 'Question text too short'),
  type:           z.enum(['MCQ', 'SHORT', 'LONG', 'TRUE_FALSE']),
  difficulty:     z.enum(['easy', 'medium', 'hard']),
  marks:          z.number().positive(),
  options:        z.array(z.string()).length(4).optional(),
}).refine(q => {
  // MCQ must have exactly 4 options
  if (q.type === 'MCQ' && (!q.options || q.options.length !== 4)) return false;
  return true;
}, { message: 'MCQ questions must have exactly 4 options' });

const SectionZodSchema = z.object({
  sectionLabel: z.string().min(1),
  title:        z.string().min(3),
  instruction:  z.string().min(5),
  questions:    z.array(QuestionZodSchema).min(1),
});

const PaperZodSchema = z.object({
  title:    z.string().min(3),
  sections: z.array(SectionZodSchema).min(1),
});

export class ResponseParser {
  static parse(rawText: string): z.infer<typeof PaperZodSchema> {
    // Strip potential markdown code fences
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    // Attempt JSON parse
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new LLMParseError('LLM_PARSE_ERROR', 'Response is not valid JSON');
    }

    // Zod validation
    const result = PaperZodSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new LLMParseError('LLM_SCHEMA_ERROR', `Schema validation failed: ${issues}`);
    }

    return result.data;
  }
}
```

---

## 6. LLM Client (Abstraction Layer)

```typescript
// ai/llmClient.ts
export interface LLMPrompt {
  system: string;
  user:   string;
}

export interface LLMResponse {
  text:         string;
  model:        string;
  promptTokens: number;
  totalTokens:  number;
}

export class LLMClient {
  static async complete(prompt: LLMPrompt): Promise<LLMResponse> {
    const provider = process.env.LLM_PROVIDER ?? 'openai';

    switch (provider) {
      case 'openai':     return OpenAIAdapter.complete(prompt);
      case 'anthropic':  return AnthropicAdapter.complete(prompt);
      case 'ollama':     return OllamaAdapter.complete(prompt);
      default:           throw new Error(`Unknown LLM provider: ${provider}`);
    }
  }
}
```

### OpenAI Adapter
```typescript
static async complete(prompt: LLMPrompt): Promise<LLMResponse> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model:       process.env.LLM_MODEL ?? 'gpt-4o-mini',
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user',   content: prompt.user   },
    ],
    response_format: { type: 'json_object' },   // Force JSON mode
    temperature: 0.7,
    max_tokens:  4000,
  });
  return {
    text:         response.choices[0].message.content!,
    model:        response.model,
    promptTokens: response.usage?.prompt_tokens ?? 0,
    totalTokens:  response.usage?.total_tokens  ?? 0,
  };
}
```

### Anthropic Adapter
```typescript
static async complete(prompt: LLMPrompt): Promise<LLMResponse> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model:      process.env.LLM_MODEL ?? 'claude-3-haiku-20240307',
    max_tokens: 4000,
    system:     prompt.system,
    messages:   [{ role: 'user', content: prompt.user }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return {
    text,
    model:        response.model,
    promptTokens: response.usage.input_tokens,
    totalTokens:  response.usage.input_tokens + response.usage.output_tokens,
  };
}
```

---

## 7. Retry Strategy on Parse Failure

```typescript
// In generation.worker.ts
const MAX_PARSE_RETRIES = 2;

async function generateWithRetry(prompt: LLMPrompt, attempt = 0) {
  try {
    const rawResponse = await LLMClient.complete(prompt);
    return ResponseParser.parse(rawResponse.text);
  } catch (err) {
    if (err instanceof LLMParseError && attempt < MAX_PARSE_RETRIES) {
      // Append clarifying message and retry
      const retryPrompt = {
        ...prompt,
        user: prompt.user + `\n\nPrevious attempt failed: ${err.message}. IMPORTANT: Return ONLY valid JSON matching the schema. No extra text.`,
      };
      return generateWithRetry(retryPrompt, attempt + 1);
    }
    throw err;  // Re-throw after max retries
  }
}
```

---

## 8. Recommended LLM Models

| Provider  | Model              | Notes                                               |
|-----------|--------------------|-----------------------------------------------------|
| OpenAI    | `gpt-4o-mini`      | **Recommended** — fast, cheap, reliable JSON output |
| OpenAI    | `gpt-4o`           | Higher quality, better for complex papers           |
| Anthropic | `claude-3-haiku`   | Fast and affordable Anthropic option                |
| Anthropic | `claude-3-sonnet`  | Higher quality Anthropic option                     |
| Ollama    | `llama3`           | Free/local, may need more prompt tuning             |
| Ollama    | `mistral`          | Good local OSS alternative                          |
