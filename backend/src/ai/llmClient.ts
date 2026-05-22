import Groq from 'groq-sdk';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { LLMPrompt } from './promptBuilder';

export interface LLMResponse {
  text:         string;
  model:        string;
  promptTokens: number;
  totalTokens:  number;
}

// Singleton Groq client
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
    logger.info('✅ Groq client initialized');
  }
  return groqClient;
}

export class LLMClient {
  static async complete(prompt: LLMPrompt): Promise<LLMResponse> {
    const client = getGroqClient();
    const model  = env.LLM_MODEL;

    logger.debug(`Calling Groq model: ${model}`);

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user',   content: prompt.user   },
      ],
      // Groq supports JSON mode on llama-3.1-70b-versatile and mixtral-8x7b-32768
      response_format: { type: 'json_object' },
      temperature:  0.7,
      max_tokens:   4096,
    });

    const text: string  = response.choices[0]?.message?.content ?? '';
    const promptTokens  = response.usage?.prompt_tokens ?? 0;
    const totalTokens   = response.usage?.total_tokens  ?? 0;

    logger.debug(`Groq response received — tokens used: ${totalTokens}`);

    return { text, model: response.model ?? env.LLM_MODEL, promptTokens, totalTokens };
  }
}
