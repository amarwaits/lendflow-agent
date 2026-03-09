import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { apiRouter } from './routes';
import { swaggerSpec } from './swagger';

export function createApp(): express.Application {
  const app = express();

  const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
  app.use(cors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['*'],
  }));

  app.use(express.json());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'LendFlow API Docs',
  }));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  app.use('/api', apiRouter);

  return app;
}
