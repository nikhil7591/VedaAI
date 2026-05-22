import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV:       z.enum(['development', 'production', 'test']).default('development'),
  PORT:           z.string().default('4000').transform(Number),
  MONGODB_URI:    z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL:      z.string().min(1, 'REDIS_URL is required (Upstash TLS URL)'),
  GROQ_API_KEY:   z.string().min(1, 'GROQ_API_KEY is required'),
  LLM_MODEL:      z.string().default('llama-3.1-70b-versatile'),
  FRONTEND_URL:   z.string().default('http://localhost:3000'),
  REDIS_TTL_PAPER: z.string().default('3600').transform(Number),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
