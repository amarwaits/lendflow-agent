import { Router, Request, Response } from 'express';

export const architectureRouter = Router();

architectureRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    architecture_layers: {
      presentation: 'React dashboard with customer onboarding and admin workflow routes',
      api: 'Express/Node.js service handling onboarding, underwriting calculations, admin auth and workflow',
      underwriting_engine: 'Weighted scoring model + loan-specific rule thresholds + manual override path',
      data: 'SQLite database with applications, underwriting_rules and audit events',
      observability: 'Audit timeline per application and dashboard-level aggregates',
    },
    recommended_technologies: {
      frontend: ['React', 'Tailwind CSS', 'Shadcn UI', 'Recharts'],
      backend: ['Express', 'TypeScript', 'better-sqlite3'],
      database: ['SQLite for easy setup', 'PostgreSQL as scale-up path'],
      deployment: ['Docker', 'docker-compose'],
    },
    deployment_summary:
      'Containerize backend with Node.js/Express and run frontend separately using docker-compose for easy local deployment.',
  });
});
