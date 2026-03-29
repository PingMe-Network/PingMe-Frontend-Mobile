import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/base/apiResponse";
import type {
  LoginRequest,
  MobileAuthResponse,
  RegisterRequest,
} from "@/types/auth";
import { getSessionMetaRequest } from "@/utils/sessionMetaHandler";

export const loginMobileApi = async (data: LoginRequest) => {
  const metaData = await getSessionMetaRequest();

  return axiosClient.post<ApiResponse<MobileAuthResponse>>(
    "/auth-service/auth/mobile/login",
    {
      ...data,
      submitSessionMetaRequest: metaData,
    },
  );
};

export const registerApi = (data: RegisterRequest) => {
  return axiosClient.post<ApiResponse<void>>(
    "/auth-service/auth/register",
    data,
  );
};

export const logoutApi = () => {
  return axiosClient.post("/auth-service/auth/logout");
};
