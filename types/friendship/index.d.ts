import type { UserSummaryResponse } from "../common/userSummary";

export interface FriendInvitationRequest {
  targetUserId: number;
}

export interface FriendshipSummary {
  id: number;
  friendshipStatus: "PENDING" | "ACCEPTED";
}

export interface HistoryFriendshipResponse {
  userSummaryResponses: UserSummaryResponse[];
  hasMore: boolean;
  nextBeforeId: number;
}

export interface UserFriendshipStatsResponse {
  totalFriends: number;
  totalSentInvites: number;
  totalReceivedInvites: number;
}

// ── Socket Event Types ──
export type FriendshipEventType =
  | "INVITED"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELED"
  | "DELETED";

export interface FriendshipEventPayload {
  type: FriendshipEventType;
  userSummaryResponse: UserSummaryResponse;
}
