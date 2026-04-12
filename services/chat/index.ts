import axiosClient from "@/lib/axiosClient";
import type {
  ApiResponse,
  PageResponse,
  PaginationParams,
} from "@/types/base/apiResponse";
import type {
  HistoryMessageResponse,
  MarkReadRequest,
  MessageResponse,
  SendMessageRequest,
} from "@/types/chat/message";
import type {
  CreateOrGetDirectRoomRequest,
  CreateGroupRoomRequest,
  RoomResponse,
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

export const recallMessageApi = (messageId: string) => {
  return axiosClient.delete<ApiResponse<{ id: string }>>(
    `/core-service/messages/${messageId}/recall`
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
