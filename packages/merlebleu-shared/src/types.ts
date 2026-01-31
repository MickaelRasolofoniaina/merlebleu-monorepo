// Define your shared types here
export type User = {
  id: string;
  email: string;
  name: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
