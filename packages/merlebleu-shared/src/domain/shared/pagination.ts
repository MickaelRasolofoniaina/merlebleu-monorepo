export type ResultPaged<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export const DEFAULT_PAGE_SIZE = 20;