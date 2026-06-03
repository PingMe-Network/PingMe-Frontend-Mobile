import type { ChatMessageType } from "@/types/chat/message";

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
  messageType: ChatMessageType;
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
  leftUserId?: number;
  newOwnerId?: number | null;
  ownerChanged?: boolean;
  dissolved?: boolean;
}

export interface DissolveGroupResponse {
  roomId: number;
  dissolvedByUserId?: number;
  dissolved?: boolean;
}

export interface GroupSettingsResponse {
  roomId: number;
  allowMemberEditGroupProfile: boolean;
  allowMemberPinMessage: boolean;
  allowMemberCreateNote: boolean;
  allowMemberCreatePoll: boolean;
  allowMemberSendMessage: boolean;
  joinApprovalEnabled: boolean;
  highlightAdminMessageOnly: boolean;
  allowNewMemberReadRecent: boolean;
  joinLinkEnabled: boolean;
  joinLink: string | null;
}

export interface UpdateGroupSettingsRequest {
  allowMemberEditGroupProfile?: boolean;
  allowMemberPinMessage?: boolean;
  allowMemberCreateNote?: boolean;
  allowMemberCreatePoll?: boolean;
  allowMemberSendMessage?: boolean;
  joinApprovalEnabled?: boolean;
  highlightAdminMessageOnly?: boolean;
  allowNewMemberReadRecent?: boolean;
  joinLinkEnabled?: boolean;
}

export type GroupJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";

export interface GroupJoinRequestResponse {
  id: number;
  roomId: number;
  requesterId: number;
  requesterName: string;
  requesterAvatarUrl: string | null;
  status: GroupJoinRequestStatus;
  reviewedByUserId: number | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface JoinGroupByLinkRequest {
  joinLinkToken: string;
}

export interface JoinGroupByLinkResponse {
  approvedImmediately: boolean;
  message: string;
  room: RoomResponse | null;
  joinRequest: GroupJoinRequestResponse | null;
}
