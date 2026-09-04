import { Response } from 'express';
import { HTTP_STATUS } from '../constants';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ResponseHelper {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = HTTP_STATUS.OK,
    meta?: ApiResponse['meta']
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      errors: null,
    };
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return this.success(res, message, data, HTTP_STATUS.CREATED);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: unknown[]
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      errors: errors || null,
    });
  }

  static paginated<T>(
    res: Response,
    message: string,
    data: T[],
    page: number,
    limit: number,
    total: number
  ): Response {
    return this.success(res, message, data, HTTP_STATUS.OK, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }
}
