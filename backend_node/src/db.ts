import Database from 'better-sqlite3';
import path from 'path';
import { utcNowIso } from './utils';

const DB_PATH =
  process.env.DB_PATH ||
  path.resolve(__dirname, '../loan_onboarding.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

export function initDb(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS underwriting_rules (
      loan_type TEXT PRIMARY KEY,
      min_credit_score INTEGER NOT NULL,
      max_dti REAL NOT NULL,
      approval_score REAL NOT NULL,
      review_score REAL NOT NULL,
      weight_credit REAL NOT NULL,
      weight_income REAL NOT NULL,
      weight_dti REAL NOT NULL,
      weight_employment REAL NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      loan_type TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      annual_income REAL NOT NULL,
      loan_amount REAL NOT NULL,
      credit_score INTEGER NOT NULL,
      monthly_debt REAL NOT NULL,
      employment_years REAL NOT NULL,
      debt_to_income REAL NOT NULL,
      score_credit REAL NOT NULL,
      score_income REAL NOT NULL,
      score_dti REAL NOT NULL,
      score_employment REAL NOT NULL,
      weighted_score REAL NOT NULL,
      auto_decision TEXT NOT NULL,
      final_decision TEXT NOT NULL,
      status TEXT NOT NULL,
      override_reason TEXT,
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS application_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    )
  `);

  const now = utcNowIso();
  const insertRule = db.prepare(`
    INSERT OR IGNORE INTO underwriting_rules (
      loan_type, min_credit_score, max_dti, approval_score, review_score,
      weight_credit, weight_income, weight_dti, weight_employment, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultRules: [string, number, number, number, number, number, number, number, number, string][] = [
    ['home',     680, 45, 78, 60, 0.40, 0.25, 0.20, 0.15, now],
    ['car',      640, 50, 74, 56, 0.35, 0.30, 0.20, 0.15, now],
    ['personal', 620, 55, 70, 52, 0.32, 0.28, 0.25, 0.15, now],
  ];

  for (const rule of defaultRules) {
    insertRule.run(...rule);
  }
}

export function addAuditEntry(
  applicationId: string,
  action: string,
  actor: string,
  details: string,
): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO application_audit (application_id, action, actor, details, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(applicationId, action, actor, details, utcNowIso());
}
