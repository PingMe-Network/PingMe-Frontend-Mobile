import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/base/apiResponse";
import type { UserSummaryResponse } from "@/types/user/userSummary";
import type { UserSummarySimpleResponse } from "@/types/user/userSummarySimpleResponse";

export const lookupApi = (email: string) => {
  return axiosClient.get<ApiResponse<UserSummaryResponse>>(
    `/core-service/users/lookup/${email}`
  );
};

export const lookupByIdApi = (id: number) => {
  return axiosClient.get<ApiResponse<UserSummarySimpleResponse>>(
    `/core-service/users/lookup/id?id=${id}`
  );
};
