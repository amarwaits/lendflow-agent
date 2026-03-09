import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        detail: result.error.errors.map((e) => ({
          loc: e.path,
          msg: e.message,
          type: e.code,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
