export type UserStatus = "ONLINE" | "OFFLINE";

export type UserStatusPayload = {
  userId: string;
  name: string;
  isOnline: boolean;
};
