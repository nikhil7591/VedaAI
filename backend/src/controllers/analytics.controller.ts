import { Request, Response } from 'express';
import { Assignment } from '../models/Assignment.model';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import Groq from 'groq-sdk';
import { env } from '../config/env';

let groq: Groq | null = null;
const getGroq = () => {
  if (!groq) groq = new Groq({ apiKey: env.GROQ_API_KEY });
  return groq;
};

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  logger.debug('Fetching analytics dashboard...');

  // 1. Basic counts
  const [total, completed, processing, pending, failed] = await Promise.all([
    Assignment.countDocuments(),
    Assignment.countDocuments({ status: 'completed' }),
    Assignment.countDocuments({ status: 'processing' }),
    Assignment.countDocuments({ status: 'pending' }),
    Assignment.countDocuments({ status: 'failed' }),
  ]);

  // 2. Assignments by subject
  const bySubject = await Assignment.aggregate([
    { $group: { _id: '$subject', count: { $sum: 1 } } },
    { $sort: { count: -1 as const } },
    { $limit: 10 },
  ]);

  // 3. Assignments over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const overTime = await Assignment.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 as const } },
  ]);

  // 4. Average marks by subject (completed only)
  const avgMarksBySubject = await Assignment.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$subject',
        avgMarks: { $avg: '$totalMarks' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 as const } },
  ]);

  // 5. Top question types
  const questionTypeStats = await Assignment.aggregate([
    { $unwind: '$questionTypes' },
    { $group: { _id: '$questionTypes', count: { $sum: 1 } } },
    { $sort: { count: -1 as const } },
  ]);

  const stats = {
    total,
    completed,
    processing,
    pending,
    failed,
    successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    bySubject: bySubject.map((s: { _id: string; count: number }) => ({
      subject: s._id,
      count: s.count,
    })),
    overTime: overTime.map((d: { _id: string; count: number }) => ({
      date: d._id,
      count: d.count,
    })),
    avgMarksBySubject: avgMarksBySubject.map(
      (s: { _id: string; avgMarks: number; count: number }) => ({
        subject: s._id,
        avgMarks: Math.round(s.avgMarks),
        count: s.count,
      })
    ),
    questionTypeStats: questionTypeStats.map(
      (q: { _id: string; count: number }) => ({
        type: q._id,
        count: q.count,
      })
    ),
  };

  // 6. AI Insights (graceful failure — dashboard works even if AI fails)
  let insights: string[] = [];
  try {
    if (total > 0) {
      const statsJson = JSON.stringify({
        total,
        completed,
        failed,
        processing,
        successRate: stats.successRate,
        subjects: bySubject.map(
          (s: { _id: string; count: number }) => `${s._id}: ${s.count}`
        ),
        avgMarks: avgMarksBySubject.map(
          (s: { _id: string; avgMarks: number }) =>
            `${s._id}: ${Math.round(s.avgMarks)}`
        ),
        questionTypes: questionTypeStats.map(
          (q: { _id: string; count: number }) => `${q._id}: ${q.count}`
        ),
      });

      const completion = await getGroq().chat.completions.create({
        model: env.LLM_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an educational data analyst. Analyze assessment statistics and provide actionable insights. Respond ONLY with valid JSON: {"insights": ["insight1", "insight2", "insight3"]}',
          },
          {
            role: 'user',
            content: `Analyze these assessment platform statistics and give 3 concise, actionable insights for teachers (1 sentence each, be specific):\n${statsJson}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 500,
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw) as { insights?: string[] };
      insights = parsed.insights ?? [];
    }
  } catch (err) {
    logger.warn('Failed to generate AI insights for analytics:', err);
    insights = [
      'AI insights are temporarily unavailable. Your dashboard data is still accurate.',
    ];
  }

  res.json({
    success: true,
    data: { ...stats, insights },
  });
});
