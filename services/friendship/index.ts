import axiosClient from "@/lib/axiosClient";
import type { ApiResponse } from "@/types/base/apiResponse";
import type {
  FriendInvitationRequest,
  HistoryFriendshipResponse,
  UserFriendshipStatsResponse,
} from "@/types/friendship";
import type { UserSummaryResponse } from "@/types/common/userSummary";

// ── Friendship Actions ──

export const sendInvitationApi = (data: FriendInvitationRequest) => {
  return axiosClient.post("/core-service/friendships", data);
};

export const acceptInvitationApi = (id: number) => {
  return axiosClient.post(`/core-service/friendships/${id}/accept`);
};

export const rejectInvitationApi = (id: number) => {
  return axiosClient.delete(`/core-service/friendships/${id}/reject`);
};

export const cancelInvitationApi = (id: number) => {
  return axiosClient.delete(`/core-service/friendships/${id}/cancel`);
};

export const deleteFriendshipApi = (id: number) => {
  return axiosClient.delete(`/core-service/friendships/${id}`);
};

// ── Friendship List APIs ──

export const getAcceptedFriendshipHistoryListApi = (
  beforeId?: number,
  size: number = 20
) => {
  const params = new URLSearchParams();
  params.append("size", size.toString());
  if (beforeId !== undefined) params.append("beforeId", beforeId.toString());

  return axiosClient.get<ApiResponse<HistoryFriendshipResponse>>(
    `/core-service/friendships/history?${params.toString()}`
  );
};

export const getReceivedHistoryInvitationsApi = (
  beforeId?: number,
  size: number = 20
) => {
  const params = new URLSearchParams();
  params.append("size", size.toString());
  if (beforeId !== undefined) params.append("beforeId", beforeId.toString());

  return axiosClient.get<ApiResponse<HistoryFriendshipResponse>>(
    `/core-service/friendships/history/received?${params.toString()}`
  );
};

export const getSentHistoryInvitationsApi = (
  beforeId?: number,
  size: number = 20
) => {
  const params = new URLSearchParams();
  params.append("size", size.toString());
  if (beforeId !== undefined) params.append("beforeId", beforeId.toString());

  return axiosClient.get<ApiResponse<HistoryFriendshipResponse>>(
    `/core-service/friendships/history/sent?${params.toString()}`
  );
};

export const getUserFriendshipStatsApi = () => {
  return axiosClient.get<ApiResponse<UserFriendshipStatsResponse>>(
    `/core-service/friendships/me/stats`
  );
};

// ── User Lookup APIs ──

export const lookupUserByEmailApi = (email: string) => {
  return axiosClient.get<ApiResponse<UserSummaryResponse>>(
    `/core-service/users/lookup/${email}`
  );
};
