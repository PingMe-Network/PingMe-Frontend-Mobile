import axiosClient from "@/lib/axiosClient";
import type {
  ApiResponse,
  PageResponse,
  PaginationParams,
} from "@/types/base/apiResponse";
import type {
  BulkForwardMessageRequest,
  CreateNoteMessageRequest,
  CreatePollMessageRequest,
  CreateReminderMessageRequest,
  EditMessageRequest,
  ForwardMessageRequest,
  GroupMessageSummaryResponse,
  HistoryMessageResponse,
  MarkReadRequest,
  MessageResponse,
  SendMessageRequest,
  VotePollRequest,
} from "@/types/chat/message";
import type {
  AddGroupMembersRequest,
  CreateOrGetDirectRoomRequest,
  CreateGroupRoomRequest,
  DissolveGroupResponse,
  GroupJoinRequestResponse,
  GroupJoinRequestStatus,
  GroupSettingsResponse,
  JoinGroupByLinkRequest,
  JoinGroupByLinkResponse,
  LeaveGroupRequest,
  LeaveGroupResponse,
  RoomResponse,
  UpdateGroupSettingsRequest,
} from "@/types/chat/room";

// ==================================================================================
// Rooms Service
// ==================================================================================

export const createOrGetDirectRoomApi = (
  data: CreateOrGetDirectRoomRequest
) => {
  return axiosClient.post<ApiResponse<RoomResponse>>("/core-service/rooms/direct", data);
};

export const createGroupRoomApi = (data: CreateGroupRoomRequest) => {
  return axiosClient.post<ApiResponse<RoomResponse>>("/core-service/rooms/group", data);
};

export const addGroupMembersApi = (data: AddGroupMembersRequest) => {
  return axiosClient.post<ApiResponse<RoomResponse>>(
    "/core-service/rooms/group/add-members",
    data
  );
};

export const removeGroupMemberApi = (roomId: number, targetUserId: number) => {
  return axiosClient.delete<ApiResponse<RoomResponse>>(
    `/core-service/rooms/group/${roomId}/members/${targetUserId}`
  );
};

export const changeMemberRoleApi = (
  roomId: number,
  targetUserId: number,
  role: "ADMIN" | "MEMBER" | "OWNER"
) => {
  return axiosClient.put<ApiResponse<RoomResponse>>(
    `/core-service/rooms/group/${roomId}/members/${targetUserId}/role?newRole=${role}`
  );
};

export const leaveGroupApi = (roomId: number, data: LeaveGroupRequest = {}) => {
  return axiosClient.delete<ApiResponse<LeaveGroupResponse>>(
    `/core-service/rooms/group/${roomId}/leave`,
    { data }
  );
};

export const dissolveGroupApi = (roomId: number) => {
  return axiosClient.delete<ApiResponse<DissolveGroupResponse>>(
    `/core-service/rooms/group/${roomId}`
  );
};

export const renameGroupApi = (roomId: number, name: string) => {
  return axiosClient.put<ApiResponse<RoomResponse>>(
    `/core-service/rooms/group/${roomId}/name?name=${encodeURIComponent(name)}`
  );
};

export const updateGroupImageApi = (
  roomId: number,
  roomImage: { uri: string; name: string; type: string } | null
) => {
  const formData = new FormData();
  if (roomImage) {
    formData.append("file", roomImage as any);
  }

  return axiosClient.put<ApiResponse<RoomResponse>>(
    `/core-service/rooms/group/${roomId}/image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const getCurrentUserRoomsApi = ({
  page = 0,
  size = 10,
}: PaginationParams) => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  return axiosClient.get<ApiResponse<PageResponse<RoomResponse>>>(
    `/core-service/rooms?${params.toString()}`
  );
};

export const getGroupSettingsApi = (roomId: number) => {
  return axiosClient.get<ApiResponse<GroupSettingsResponse>>(
    `/core-service/rooms/group/${roomId}/settings`
  );
};

export const updateGroupSettingsApi = (
  roomId: number,
  data: UpdateGroupSettingsRequest
) => {
  return axiosClient.patch<ApiResponse<GroupSettingsResponse>>(
    `/core-service/rooms/group/${roomId}/settings`,
    data
  );
};

export const regenerateGroupJoinLinkApi = (roomId: number) => {
  return axiosClient.post<ApiResponse<GroupSettingsResponse>>(
    `/core-service/rooms/group/${roomId}/settings/join-link/regenerate`
  );
};

export const joinGroupByLinkApi = (data: JoinGroupByLinkRequest) => {
  return axiosClient.post<ApiResponse<JoinGroupByLinkResponse>>(
    "/core-service/rooms/group/join-by-link",
    data
  );
};

export const getGroupJoinRequestsApi = (
  roomId: number,
  status?: GroupJoinRequestStatus
) => {
  const suffix = status ? `?status=${status}` : "";
  return axiosClient.get<ApiResponse<GroupJoinRequestResponse[]>>(
    `/core-service/rooms/group/${roomId}/join-requests${suffix}`
  );
};

export const reviewGroupJoinRequestApi = (
  roomId: number,
  joinRequestId: number,
  approved: boolean
) => {
  return axiosClient.patch<ApiResponse<GroupJoinRequestResponse>>(
    `/core-service/rooms/group/${roomId}/join-requests/${joinRequestId}`,
    { approved }
  );
};

export const cancelMyGroupJoinRequestApi = (roomId: number) => {
  return axiosClient.delete<ApiResponse<GroupJoinRequestResponse>>(
    `/core-service/rooms/group/${roomId}/join-requests/me`
  );
};

// ==================================================================================
// Messages Service
// ==================================================================================

export const sendMessageApi = (data: SendMessageRequest) => {
  return axiosClient.post<ApiResponse<MessageResponse>>("/core-service/messages", data);
};

export const sendFileMessageApi = (data: FormData) => {
  return axiosClient.post<ApiResponse<MessageResponse>>(
    "/core-service/messages/files",
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const sendImageBatchMessageApi = (data: FormData) => {
  return axiosClient.post<ApiResponse<MessageResponse>>(
    "/core-service/messages/files/images",
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const recallMessageApi = (messageId: string) => {
  return axiosClient.delete<ApiResponse<{ id: string }>>(
    `/core-service/messages/${messageId}/recall`
  );
};

export const deleteMessageForMeApi = (messageId: string) => {
  return axiosClient.delete<ApiResponse<void>>(
    `/core-service/messages/${messageId}/delete-for-me`
  );
};

export const editMessageApi = (messageId: string, data: EditMessageRequest) => {
  return axiosClient.patch<ApiResponse<MessageResponse>>(
    `/core-service/messages/${messageId}`,
    data
  );
};

export const forwardMessageApi = (data: ForwardMessageRequest) => {
  return axiosClient.post<ApiResponse<MessageResponse>>(
    "/core-service/messages/forward",
    data
  );
};

export const bulkForwardMessageApi = (data: BulkForwardMessageRequest) => {
  return axiosClient.post<ApiResponse<MessageResponse[]>>(
    "/core-service/messages/forward/bulk",
    data
  );
};

export const markAsReadApi = (data: MarkReadRequest) => {
  return axiosClient.post<ApiResponse<MessageResponse>>("/core-service/messages/read", data);
};

export const getHistoryMessagesApi = (
  roomId: number,
  beforeId?: string,
  size: number = 20
) => {
  const params = new URLSearchParams();
  params.append("roomId", roomId.toString());
  params.append("size", size.toString());
  if (beforeId !== undefined) {
    params.append("beforeId", beforeId);
  }

  return axiosClient.get<ApiResponse<HistoryMessageResponse>>(
    `/core-service/messages/history?${params.toString()}`
  );
};

export const pinMessageApi = (messageId: string) => {
  return axiosClient.patch<ApiResponse<MessageResponse>>(
    `/core-service/messages/${messageId}/pin`
  );
};

export const unpinMessageApi = (messageId: string) => {
  return axiosClient.patch<ApiResponse<MessageResponse>>(
    `/core-service/messages/${messageId}/unpin`
  );
};

export const getPinnedMessagesApi = (roomId: number) => {
  return axiosClient.get<ApiResponse<MessageResponse[]>>(
    `/core-service/messages/pinned?roomId=${roomId}`
  );
};

export const createPollMessageApi = (data: CreatePollMessageRequest) => {
  return axiosClient.post<ApiResponse<MessageResponse>>(
    "/core-service/messages/polls",
    data
  );
};

export const createNoteMessageApi = (data: CreateNoteMessageRequest) => {
  return axiosClient.post<ApiResponse<MessageResponse>>(
    "/core-service/messages/notes",
    data
  );
};

export const createReminderMessageApi = (data: CreateReminderMessageRequest) => {
  return axiosClient.post<ApiResponse<MessageResponse>>(
    "/core-service/messages/reminders",
    data
  );
};

export const votePollApi = (messageId: string, data: VotePollRequest) => {
  return axiosClient.patch<ApiResponse<MessageResponse>>(
    `/core-service/messages/${messageId}/poll/vote`,
    data
  );
};

export const getGroupMessageSummaryApi = (roomId: number) => {
  return axiosClient.get<ApiResponse<GroupMessageSummaryResponse>>(
    `/core-service/messages/summary?roomId=${roomId}`
  );
};
