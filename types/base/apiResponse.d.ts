export interface ApiResponse<T> {
  errorCode: number;
  errorMessage: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page: number;
  size: number;
  filter?: string | null;
}
