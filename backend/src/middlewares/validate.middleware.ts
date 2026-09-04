import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ResponseHelper } from '../utils/response';
import { HTTP_STATUS, MESSAGES } from '../constants';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: ValidateTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const result = schema.parse(data);
      req[target] = result;
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const zodErr = error as ZodError & { errors: { path: (string | number)[]; message: string }[] };
        const errors = zodErr.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        ResponseHelper.error(
          res,
          MESSAGES.GENERAL.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
          errors
        );
        return;
      }
      next(error);
    }
  };
};
