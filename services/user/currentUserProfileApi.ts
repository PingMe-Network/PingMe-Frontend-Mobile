import type { ApiResponse } from "@/types/base/apiResponse";
import type {
  ChangePasswordRequest,
  ChangeProfileRequest,
  CurrentUserProfileResponse,
  CurrentUserSessionResponse,
} from "@/types/auth";
import axiosClient from "@/lib/axiosClient";

export const getCurrentUserSessionApi = () => {
  return axiosClient.get<ApiResponse<CurrentUserSessionResponse>>(
    "/auth-service/users/me",
  );
};

export const getCurrentUserInfoApi = () => {
  return axiosClient.get<ApiResponse<CurrentUserProfileResponse>>(
    "/auth-service/users/me/info",
  );
};

export const updateCurrentUserPasswordApi = (
  changePasswordRequest: ChangePasswordRequest,
) => {
  return axiosClient.post<ApiResponse<CurrentUserSessionResponse>>(
    "/auth-service/users/me/password",
    changePasswordRequest,
  );
};

export const updateCurrentUserProfileApi = (
  changeProfileRequest: ChangeProfileRequest,
) => {
  return axiosClient.post<ApiResponse<CurrentUserSessionResponse>>(
    "/auth-service/users/me/profile",
    changeProfileRequest,
  );
};

export const updateCurrentUserAvatarApi = (data: FormData) => {
  return axiosClient.post<ApiResponse<CurrentUserSessionResponse>>(
    "/auth-service/users/me/avatar",
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
};

export const activateAccountApi = () => {
  return axiosClient.post<ApiResponse<{ isActivated: boolean }>>(
    "/auth-service/users/me/activate",
  );
};
