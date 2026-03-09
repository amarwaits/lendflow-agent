import { Router } from 'express';
import { publicRouter } from './public';
import { adminRouter } from './admin';
import { adminApplicationsRouter } from './adminApplications';
import { adminRulesRouter } from './adminRules';
import { architectureRouter } from './architecture';

export const apiRouter = Router();

apiRouter.use('/', publicRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/admin/applications', adminApplicationsRouter);
apiRouter.use('/admin/rules', adminRulesRouter);
apiRouter.use('/architecture', architectureRouter);
