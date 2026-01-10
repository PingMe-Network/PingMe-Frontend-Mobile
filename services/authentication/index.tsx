import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/base/apiResponse";
import type { LoginRequest, MobileAuthResponse } from "@/types/authentication";
import { getSessionMetaRequest } from "@/utils/sessionMetaHandler";

export const loginMobileApi = (data: LoginRequest) => {
  const metaData = getSessionMetaRequest();

  return axiosClient.post<ApiResponse<MobileAuthResponse>>(
    "/auth/mobile/login",
    {
      ...data,
      submitSessionMetaRequest: metaData,
    }
  );
};

export const logoutApi = () => {
  return axiosClient.post("/auth/logout");
};
