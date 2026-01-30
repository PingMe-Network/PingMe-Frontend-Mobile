import type { ApiResponse } from "@/types/base/apiResponse";
import type {
  CurrentUserSessionMetaResponse,
  CurrentUserSessionResponse,
} from "@/types/authentication";
import axiosClient from "@/lib/axiosClient";

export const getCurrentUserAllDeviceMetasApi = () => {
  return axiosClient.get<ApiResponse<CurrentUserSessionMetaResponse[]>>(
    "/users/me/sessions",
  );
};

export const deleteCurrentUserDeviceMetaApi = (sessionId: string) => {
  return axiosClient.delete<ApiResponse<CurrentUserSessionResponse>>(
    `/users/me/sessions/${sessionId}`,
  );
};
