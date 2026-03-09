import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { validate } from '../middleware/validate';
import { AdminLoginSchema } from '../types';
import { createToken, requireAdmin } from '../auth';

export const adminRouter = Router();

adminRouter.post('/login', validate(AdminLoginSchema), (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ detail: 'Invalid credentials' });
    return;
  }
  res.json({ access_token: createToken(username), token_type: 'bearer' });
});

adminRouter.get('/dashboard', requireAdmin, (_req: Request, res: Response) => {
  const db = getDb();

  const total = (db.prepare('SELECT COUNT(*) AS count FROM applications').get() as { count: number }).count;

  const statusMap: Record<string, number> = {
    pending_review: 0, in_review: 0, approved: 0, rejected: 0,
    auto_approved: 0, auto_rejected: 0, overridden: 0, on_hold: 0,
  };
  const statusRows = db.prepare('SELECT status, COUNT(*) AS count FROM applications GROUP BY status').all() as { status: string; count: number }[];
  for (const row of statusRows) {
    if (row.status in statusMap) statusMap[row.status] = row.count;
  }

  const avgRow = db.prepare('SELECT COALESCE(AVG(weighted_score), 0) AS avg_score FROM applications').get() as { avg_score: number };

  const recentRows = db.prepare(`
    SELECT id, loan_type, full_name, weighted_score, auto_decision, final_decision, status, created_at
    FROM applications
    ORDER BY datetime(created_at) DESC
    LIMIT 8
  `).all();

  res.json({
    total_applications: total,
    pending_review: statusMap.pending_review + statusMap.in_review + statusMap.on_hold,
    approved_count: statusMap.approved + statusMap.auto_approved,
    rejected_count: statusMap.rejected + statusMap.auto_rejected,
    average_score: Math.round(avgRow.avg_score * 100) / 100,
    recent_applications: recentRows,
  });
});
