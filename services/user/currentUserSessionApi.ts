import type { ApiResponse } from "@/types/base/apiResponse";
import type {
  CurrentUserSessionMetaResponse,
  CurrentUserSessionResponse,
} from "@/types/auth";
import axiosClient from "@/lib/axiosClient";

export const getCurrentUserAllDeviceMetasApi = () => {
  return axiosClient.get<ApiResponse<CurrentUserSessionMetaResponse[]>>(
    "/auth-service/users/me/sessions",
  );
};

export const deleteCurrentUserDeviceMetaApi = (sessionId: string) => {
  return axiosClient.delete<ApiResponse<CurrentUserSessionResponse>>(
    `/auth-service/users/me/sessions/${sessionId}`,
  );
};
