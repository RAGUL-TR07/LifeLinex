import { PAGINATION } from '../constants';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationOptions = (
  page?: string | number,
  limit?: string | number
): PaginationOptions => {
  const parsedPage = Math.max(1, parseInt(String(page || PAGINATION.DEFAULT_PAGE), 10));
  const parsedLimit = Math.min(
    parseInt(String(limit || PAGINATION.DEFAULT_LIMIT), 10),
    PAGINATION.MAX_LIMIT
  );
  const skip = (parsedPage - 1) * parsedLimit;
  return { page: parsedPage, limit: parsedLimit, skip };
};

export const sanitizeQuery = (query: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const buildSortOptions = (
  sortBy?: string,
  sortOrder?: string
): Record<string, 1 | -1> => {
  if (!sortBy) return { createdAt: -1 };
  return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
};

export const toObjectId = (id: string): import('mongoose').Types.ObjectId => {
  return new (require('mongoose').Types.ObjectId)(id);
};
