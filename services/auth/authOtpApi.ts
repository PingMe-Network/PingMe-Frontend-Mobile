import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/base/apiResponse";
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/types/auth";

export const sendOtpToEmailApi = (data: SendOtpRequest) => {
  return axiosClient.post<ApiResponse<SendOtpResponse>>(
    "/auth-service/otp/send",
    data,
  );
};

export const verifyOtpApi = (data: VerifyOtpRequest) => {
  return axiosClient.post<ApiResponse<VerifyOtpResponse>>(
    "/auth-service/otp/verify",
    data,
  );
};
