import { IAssignment } from '../models/Assignment.model';

export interface LLMPrompt {
  system: string;
  user: string;
}

const SYSTEM_PROMPT = `You are an expert educator and examination paper creator.
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
9. The "options" field is ONLY required for MCQ questions. Omit it for other types.
10. ALWAYS include an "answer" field for every question — for MCQ include the correct option text, for others a brief model answer (1-2 sentences).

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
}`;

export class PromptBuilder {
  static build(assignment: IAssignment): LLMPrompt {
    const { easy, medium, hard } = assignment.difficultyDistribution;
    const total = assignment.totalQuestions;

    const easyCount   = Math.round(total * easy   / 100);
    const mediumCount = Math.round(total * medium / 100);
    const hardCount   = total - easyCount - mediumCount;

    const marksPerQuestion = Math.floor(assignment.totalMarks / total);

    const userPrompt = `Generate a complete question paper with the following configuration:

PAPER DETAILS:
- Title: "${assignment.title}"
- Subject: ${assignment.subject}
- Total Questions: ${total}
- Total Marks: ${assignment.totalMarks}
- Marks per question (approximate): ${marksPerQuestion}

QUESTION TYPES TO INCLUDE:
${assignment.questionTypes.map((t) => `- ${t}`).join('\n')}

DIFFICULTY DISTRIBUTION:
- Easy: ${easy}% (approximately ${easyCount} questions)
- Medium: ${medium}% (approximately ${mediumCount} questions)
- Hard: ${hard}% (approximately ${hardCount} questions)

SECTION ORGANIZATION:
- Create one section per question type
- Label sections A, B, C, etc.
- Write a meaningful instruction for each section

ADDITIONAL TEACHER INSTRUCTIONS:
${assignment.additionalInstructions || 'None'}

Generate the question paper now as a JSON object only.`;

    return { system: SYSTEM_PROMPT, user: userPrompt };
  }
}
