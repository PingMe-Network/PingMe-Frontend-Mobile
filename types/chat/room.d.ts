// =====================================================================
// RESPONSE
// =====================================================================
export type UserStatus = "ONLINE" | "OFFLINE";

export interface RoomResponse {
  roomId: number;
  roomType: "DIRECT" | "GROUP";
  directKey: string | null;
  name: string | null;
  lastMessage: LastMessage | null;
  participants: RoomParticipantResponse[];
  roomImgUrl: string | null;
  theme: string | null;
}

export interface RoomParticipantResponse {
  userId: number;
  name: string;
  avatarUrl: string;

  status: UserStatus;
  role: "OWNER" | "ADMIN" | "MEMBER";
  lastReadMessageId: string | null;
  lastReadAt: string | null;
}

export interface LastMessage {
  messageId: string;
  senderId: number;
  preview: string;
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE" | "WEATHER" | "SYSTEM" | "POLL";
  createdAt: string;
}

// =====================================================================
// Request
// =====================================================================

export interface CreateOrGetDirectRoomRequest {
  targetUserId: number;
}

export interface CreateGroupRoomRequest {
  name: string;
  memberIds: number[];
}

export interface AddGroupMembersRequest {
  roomId: number;
  memberIds: number[];
}

export interface LeaveGroupRequest {
  newOwnerId?: number | null;
}

export interface LeaveGroupResponse {
  roomId: number;
  ownerChanged: boolean;
  newOwnerId: number | null;
}

export interface DissolveGroupResponse {
  roomId: number;
}
