import type { FriendshipSummary } from "../friendship";

export type UserStatus = "ONLINE" | "OFFLINE";
export type AccountStatusType = "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "NON_ACTIVATED";

export interface UserSummaryResponse {
  id: number;
  email: string;
  name: string;
  avatarUrl: string;
  accountStatus: AccountStatusType;
  status?: UserStatus;
  friendshipSummary: FriendshipSummary | null;
}

export interface UserSummarySimpleResponse {
  id: number;
  name: string;
  avatarUrl: string;
}
