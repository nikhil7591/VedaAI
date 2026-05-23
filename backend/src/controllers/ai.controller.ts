import { Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import Groq from 'groq-sdk';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

let groq: Groq | null = null;
const getGroq = () => {
  if (!groq) groq = new Groq({ apiKey: env.GROQ_API_KEY });
  return groq;
};

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are supported for extraction'));
      return;
    }
    cb(null, true);
  },
});

async function callGroq(system: string, user: string): Promise<string> {
  const res = await getGroq().chat.completions.create({
    model:           env.LLM_MODEL,
    messages:        [{ role: 'system', content: system }, { role: 'user', content: user }],
    response_format: { type: 'json_object' },
    temperature:     0.6,
    max_tokens:      3000,
  });
  return res.choices[0]?.message?.content ?? '{}';
}

export const extractTextFromImage = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    res.status(400).json({
      success: false,
      error: {
        code: 'FILE_REQUIRED',
        message: 'Please upload an image file',
      },
    });
    return;
  }

  const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

  const completion = await getGroq().chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'system',
        content:
          'You extract text from assignment images. Return only valid JSON with keys text and summary. Preserve line breaks where helpful.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all readable text from this assignment image. Return JSON only in the format {"text":"...","summary":"..."}.',
          },
          {
            type: 'image_url',
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 2048,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  let parsed: { text?: string; summary?: string } = {};

  try {
    parsed = JSON.parse(raw) as { text?: string; summary?: string };
  } catch (error) {
    logger.error('Failed to parse Groq extraction response', error);
    res.status(502).json({
      success: false,
      error: {
        code: 'EXTRACTION_PARSE_ERROR',
        message: 'Failed to parse extracted content',
      },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      text: parsed.text ?? '',
      summary: parsed.summary ?? '',
    },
  });
});

// ─── 1. Auto Grader ──────────────────────────────────────────────────────────

const gradeSchema = z.object({
  questionText:  z.string().min(5),
  studentAnswer: z.string().min(1),
  maxMarks:      z.number().positive(),
  subject:       z.string().min(1),
  gradeLevel:    z.string().optional().default('Class 10'),
  correctAnswer: z.string().optional().default(''),
});

export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const body = gradeSchema.parse(req.body);
  logger.debug('Auto-grading submission...');

  const raw = await callGroq(
    `You are an expert ${body.subject} teacher grading a student's answer.
Evaluate the student's answer fairly and constructively.
Respond ONLY with valid JSON matching this schema exactly:
{
  "score": <number 0 to ${body.maxMarks}>,
  "maxMarks": ${body.maxMarks},
  "percentage": <number 0-100>,
  "grade": <"A+" | "A" | "B+" | "B" | "C" | "D" | "F">,
  "feedback": "<2-3 sentence overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "detailedBreakdown": "<detailed point-by-point analysis>"
}`,
    `Grade Level: ${body.gradeLevel}
Subject: ${body.subject}
Question: ${body.questionText}
${body.correctAnswer ? `Correct Answer / Key Points: ${body.correctAnswer}` : ''}
Student Answer: ${body.studentAnswer}
Maximum Marks: ${body.maxMarks}

Grade this answer and return JSON only.`
  );

  const result = JSON.parse(raw);
  res.json({ success: true, data: result });
});

// ─── 2. Rubric Builder ───────────────────────────────────────────────────────

const rubricSchema = z.object({
  subject:    z.string().min(1),
  topic:      z.string().min(1),
  totalMarks: z.number().positive(),
  criteria:   z.number().int().min(2).max(10).default(5),
  gradeLevel: z.string().optional().default('Class 10'),
  taskType:   z.enum(['Essay', 'Project', 'Practical', 'Presentation', 'Assignment']).default('Assignment'),
});

export const buildRubric = asyncHandler(async (req: Request, res: Response) => {
  const body = rubricSchema.parse(req.body);
  logger.debug('Building rubric...');

  const raw = await callGroq(
    `You are an expert educator creating assessment rubrics.
Create a detailed, practical rubric for teachers to use consistently.
Respond ONLY with valid JSON matching this schema:
{
  "title": "<rubric title>",
  "subject": "<subject>",
  "topic": "<topic>",
  "taskType": "<type>",
  "totalMarks": <number>,
  "criteria": [
    {
      "name": "<criterion name>",
      "description": "<what this criterion measures>",
      "maxMarks": <number>,
      "levels": [
        { "label": "Excellent", "marks": <max>, "description": "<descriptor>" },
        { "label": "Good",      "marks": <75% of max>, "description": "<descriptor>" },
        { "label": "Average",   "marks": <50% of max>, "description": "<descriptor>" },
        { "label": "Poor",      "marks": <25% of max>, "description": "<descriptor>" }
      ]
    }
  ]
}`,
    `Subject: ${body.subject}
Topic / Task: ${body.topic}
Grade Level: ${body.gradeLevel}
Task Type: ${body.taskType}
Total Marks: ${body.totalMarks}
Number of Criteria: ${body.criteria}

Build a comprehensive assessment rubric and return JSON only.`
  );

  const result = JSON.parse(raw);
  res.json({ success: true, data: result });
});

// ─── 3. Feedback Generator ───────────────────────────────────────────────────

const feedbackSchema = z.object({
  studentName:   z.string().optional().default('Student'),
  subject:       z.string().min(1),
  topic:         z.string().min(1),
  studentAnswer: z.string().min(10),
  questionText:  z.string().optional().default(''),
  marks:         z.number().optional().default(10),
  tone:          z.enum(['Encouraging', 'Neutral', 'Strict']).default('Encouraging'),
});

export const generateFeedback = asyncHandler(async (req: Request, res: Response) => {
  const body = feedbackSchema.parse(req.body);
  logger.debug('Generating student feedback...');

  const raw = await callGroq(
    `You are a supportive, experienced ${body.subject} teacher writing personalised feedback for a student.
Tone should be: ${body.tone}
Respond ONLY with valid JSON:
{
  "studentName": "<name>",
  "subject": "<subject>",
  "overallComment": "<2-3 warm, personalised sentences addressing the student by name>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "areasToImprove": ["<specific area 1>", "<specific area 2>"],
  "actionPlan": ["<concrete next step 1>", "<concrete next step 2>"],
  "motivationalClose": "<1 encouraging closing sentence>"
}`,
    `Student Name: ${body.studentName}
Subject: ${body.subject}
Topic: ${body.topic}
${body.questionText ? `Question: ${body.questionText}` : ''}
Student's Response: ${body.studentAnswer}
Marks Awarded: ${body.marks}

Generate thoughtful, personalised feedback and return JSON only.`
  );

  const result = JSON.parse(raw);
  res.json({ success: true, data: result });
});

// ─── 4. Quick Quiz Creator ───────────────────────────────────────────────────

const quizSchema = z.object({
  topic:      z.string().min(2),
  subject:    z.string().min(1),
  gradeLevel: z.string().optional().default('Class 10'),
  count:      z.number().int().min(3).max(10).default(5),
  type:       z.enum(['MCQ', 'True/False', 'Mixed']).default('MCQ'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']).default('Mixed'),
});

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  const body = quizSchema.parse(req.body);
  logger.debug('Creating quick quiz...');

  const raw = await callGroq(
    `You are an expert teacher creating a quick formative assessment quiz.
Respond ONLY with valid JSON:
{
  "title": "<quiz title>",
  "subject": "<subject>",
  "topic": "<topic>",
  "gradeLevel": "<level>",
  "estimatedMinutes": <number>,
  "questions": [
    {
      "number": <int>,
      "text": "<question text>",
      "type": "<MCQ | True/False>",
      "difficulty": "<Easy | Medium | Hard>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correctAnswer": "<correct option text>",
      "explanation": "<brief explanation of why this is correct>"
    }
  ]
}
NOTE: For True/False questions, options must be exactly ["True", "False"].
For MCQ, always provide exactly 4 options.`,
    `Subject: ${body.subject}
Topic: ${body.topic}
Grade Level: ${body.gradeLevel}
Question Type: ${body.type}
Difficulty: ${body.difficulty}
Number of Questions: ${body.count}

Create a quick formative quiz and return JSON only.`
  );

  const result = JSON.parse(raw);
  res.json({ success: true, data: result });
});
