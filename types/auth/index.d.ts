// =========================================================
// SHARED / METADATA (Dùng chung trong các Request khác)
// =========================================================
export interface SubmitSessionMetaRequest {
  deviceType?: string;
  browser?: string;
  os?: string;
}

// =========================================================
// AUTHENTICATION REQUESTS
// =========================================================
export interface LoginRequest {
  email: string;
  password: string;
  submitSessionMetaRequest?: SubmitSessionMetaRequest;
}

export interface RegisterRequest {
  email: string;
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  password: string;
  address?: string;
  dob?: string;
  turnstileToken: string;
}

export interface RefreshMobileRequest {
  refreshToken: string;
  submitSessionMetaRequest: SubmitSessionMetaRequest;
}

// =========================================================
// AUTHENTICATION RESPONSES
// =========================================================
export interface MobileAuthResponse {
  accessToken: string;
  refreshToken: string;
  userSession: CurrentUserSessionResponse;
}

// =========================================================
// USER DATA & PROFILE
// =========================================================
export interface CurrentUserSessionResponse {
  id: number;
  email: string;
  name: string;
  avatarUrl: string;
  updatedAt: string;
  roleName: string | null;
}

export interface CurrentUserProfileResponse {
  email: string;
  name: string;
  avatarUrl: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  dob?: string;
  roleName: string | null;
}

export interface CurrentUserSessionMetaResponse {
  sessionId: string;
  deviceType: string;
  browser: string;
  os: string;
  lastActiveAt: string;
  current: boolean;
}

// =========================================================
// USER ACCOUNT ACTIONS
// =========================================================
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangeProfileRequest {
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  dob?: string;
}

// =========================================================
// OTP
// =========================================================
export interface SendOtpRequest {
  mailRecipient: string;
  authOtpType: "ACCOUNT_ACTIVATION" | "USER_FORGET_PASSWORD";
}

export interface SendOtpResponse {
  isSuccess: boolean;
}

export interface VerifyOtpRequest {
  otp: string;
  mailRecipient: string;
  authOtpType: "ACCOUNT_ACTIVATION" | "USER_FORGET_PASSWORD";
}

export interface VerifyOtpResponse {
  isValid: boolean;
  resetPasswordToken?: string;
}
