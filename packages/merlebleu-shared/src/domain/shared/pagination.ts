export type ResultPaged<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};