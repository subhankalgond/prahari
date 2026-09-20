import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { badRequest } from '../utils/errors';

export function validateBody(schema: ZodType): (req: Request, _res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      next(badRequest(`${field}${issue.message}`));
      return;
    }
    req.body = result.data;
    next();
  };
}
