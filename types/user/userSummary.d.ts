import type { FriendshipSummary } from "../friendship";
import type { UserStatus } from "./userStatus";

export interface UserSummaryResponse {
  id: number;
  email: string;
  name: string;
  avatarUrl: string;
  accountStatus: AccountStatusType;
  status?: UserStatus;
  friendshipSummary: FriendshipSummary | null;
}

export type AccountStatusType = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
