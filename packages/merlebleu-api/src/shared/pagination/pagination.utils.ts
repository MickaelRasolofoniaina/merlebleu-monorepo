export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationParams = (
  options: PaginationOptions,
  defaults: { page: number; limit: number; maxLimit: number } = {
    page: 1,
    limit: 20,
    maxLimit: 100,
  },
): PaginationParams => {
  const rawPage = options.page ?? defaults.page;
  const rawLimit = options.limit ?? defaults.limit;
  const maxLimit = options.maxLimit ?? defaults.maxLimit;

  const page =
    Number.isFinite(rawPage) && rawPage > 0 ? rawPage : defaults.page;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : defaults.limit;
  const cappedLimit = Math.min(limit, maxLimit);

  return {
    page,
    limit: cappedLimit,
    skip: (page - 1) * cappedLimit,
  };
};
