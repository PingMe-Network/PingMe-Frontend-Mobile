import type { ApiResponse } from "@/types/base/apiResponse";
import { isAxiosError } from "axios";

export const getErrorMessage = (
  err: unknown,
  fallbackMessage = "Thao tác thất bại"
): string => {
  if (isAxiosError(err)) {
    const res = err.response?.data as ApiResponse<unknown>;

    return res?.errorMessage || fallbackMessage;
  }

  return fallbackMessage;
};
