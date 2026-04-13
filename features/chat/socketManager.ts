// =================================================================
// Socket Manager - Singleton cho React Native (STOMP over SockJS)
// =================================================================

// TextEncoder/TextDecoder polyfill required by @stomp/stompjs in React Native
import { TextEncoder, TextDecoder } from "text-encoding";
if (typeof global.TextEncoder === "undefined") {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  (global as any).TextDecoder = TextDecoder;
}

import SockJS from "sockjs-client";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import "react-native-url-polyfill/auto";
import { getTokens } from "@/utils/storage";
import {
  messageCreated,
  messageRecalled,
  readStateChanged,
  userTyping,
  type MessageCreatedEventPayload,
  type MessageRecalledEventPayload,
  type ReadStateChangedEvent,
  type RoomCreatedEventPayload,
  type RoomUpdatedEventPayload,
  type RoomMemberAddedEventPayload,
  type RoomMemberRemovedEventPayload,
  type RoomMemberRoleChangedEventPayload,
  type TypingSignalPayload,
} from "./chatSlice";

// =================================================================
// Event Emitter Types
// =================================================================
export interface SocketEventMap {
  MESSAGE_CREATED: MessageCreatedEventPayload;
  MESSAGE_RECALLED: MessageRecalledEventPayload;
  READ_STATE_CHANGED: ReadStateChangedEvent;
  USER_TYPING: TypingSignalPayload;

  ROOM_CREATED: RoomCreatedEventPayload;
  ROOM_UPDATED: RoomUpdatedEventPayload;
  ROOM_MEMBER_ADDED: RoomMemberAddedEventPayload;
  ROOM_MEMBER_REMOVED: RoomMemberRemovedEventPayload;
  ROOM_MEMBER_ROLE_CHANGED: RoomMemberRoleChangedEventPayload;

  FRIENDSHIP: import("@/types/friendship").FriendshipEventPayload;
  USER_STATUS: { userId: string; name: string; isOnline: boolean };
}

// =================================================================
// Types
// =================================================================
export interface SocketManagerOptions {
  baseUrl: string;
  dispatch: (action: unknown) => void;
  onDisconnect?: (reason?: string) => void;
}

// =================================================================
// JWT Helper
// =================================================================
function isJwtExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;
    const decodedJson = atob(payloadBase64);
    const payload = JSON.parse(decodedJson);
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now() + 15000;
  } catch {
    return true;
  }
}

// =================================================================
// Singleton Class
// =================================================================
class SocketManagerClass {
  private client: Client | null = null;
  private manualDisconnect = false;
  private options: SocketManagerOptions | null = null;

  // Chat subscriptions
  private userRoomsSub: StompSubscription | null = null;
  private currentRoomIdRef: number | null = null;
  private roomMsgSub: StompSubscription | null = null;
  private roomReadSub: StompSubscription | null = null;
  private roomTypingSub: StompSubscription | null = null;

  // Global subscriptions
  private statusSub: StompSubscription | null = null;
  private friendshipSub: StompSubscription | null = null;

  // =================================================================
  // EventEmitter
  // =================================================================
  private listeners: {
    [K in keyof SocketEventMap]?: Array<(payload: SocketEventMap[K]) => void>;
  } = {};

  public on<K extends keyof SocketEventMap>(
    event: K,
    listener: (payload: SocketEventMap[K]) => void
  ) {
    if (!this.listeners[event]) {
      (this.listeners as Record<string, unknown[]>)[event as string] = [];
    }
    (this.listeners as Record<string, unknown[]>)[event as string].push(
      listener
    );
    return () => this.off(event, listener);
  }

  public off<K extends keyof SocketEventMap>(
    event: K,
    listener: (payload: SocketEventMap[K]) => void
  ) {
    if (!this.listeners[event]) return;
    (this.listeners as Record<string, unknown[]>)[event as string] = (
      this.listeners as Record<string, unknown[]>
    )[event as string].filter((l) => l !== listener);
  }

  private emit<K extends keyof SocketEventMap>(
    event: K,
    payload: SocketEventMap[K]
  ) {
    if (!this.listeners[event]) return;
    this.listeners[event]!.forEach((l) => {
      try {
        l(payload);
      } catch (err) {
        console.error(`[PingMe] Error in event listener for ${event}:`, err);
      }
    });
  }

  // =================================================================
  // Public Methods
  // =================================================================
  isConnected(): boolean {
    return !!this.client?.connected;
  }

  async connect(opts: SocketManagerOptions): Promise<void> {
    if (this.isConnected()) {
      console.log("[PingMe] Already connected, skipping connect");
      return;
    }

    this.manualDisconnect = false;
    this.options = opts;

    console.log("[PingMe] Initializing WebSocket connection...");

    const { accessToken } = await getTokens();
    if (!accessToken || isJwtExpired(accessToken)) {
      console.warn("[PingMe] No valid token, cannot connect WebSocket");
      return;
    }

    this.client = new Client({
      // React Native stability: Use SockJS fallback if raw WebSocket has issues
      webSocketFactory: () => {
        const url = `${opts.baseUrl}/core-service/ws`;
        console.log("[PingMe] Creating SockJS connection to:", url);
        return new SockJS(url);
      },

      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },

      // Standard STOMP settings
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      reconnectDelay: 3000,
      
      debug: (msg) => {
        console.log("[PingMe STOMP Debug]", msg);
      },
    });

    this.client.onConnect = () => {
      console.log("[PingMe] Connected successfully!");
      this.setupSubscriptions();
    };

    this.client.onStompError = (frame) => {
      console.error(
        "[PingMe] STOMP error:",
        frame.headers["message"],
        frame.body
      );
    };

    this.client.onWebSocketError = (ev) => {
      console.error("[PingMe] WebSocket error:", ev);
    };

    this.client.onDisconnect = (frame) => {
      console.log("[PingMe] Disconnected");
      this.options?.onDisconnect?.(frame?.headers?.message);

      if (this.manualDisconnect) {
        this.cleanupAllSubscriptions();
        this.currentRoomIdRef = null;
      }
    };

    this.client.activate();
  }

  disconnect(): void {
    console.log("[PingMe] Manual disconnect initiated");
    this.manualDisconnect = true;
    this.cleanupAllSubscriptions();
    this.currentRoomIdRef = null;
    this.client?.deactivate();
    this.client = null;
  }

  sendTyping(roomId: number, isTyping: boolean): void {
    if (!this.isConnected() || !this.client) return;

    this.client.publish({
      destination: `/app/rooms/${roomId}/typing`,
      body: JSON.stringify({ isTyping }),
    });
  }

  // =================================================================
  // Chat-specific Methods
  // =================================================================
  enterRoom(roomId: number): void {
    if (!this.isConnected() || !this.client) {
      console.warn("[PingMe] Cannot enter room: not connected");
      return;
    }

    if (this.currentRoomIdRef === roomId) {
      console.log("[PingMe] Already in room:", roomId);
      return;
    }

    console.log("[PingMe] Entering room:", roomId);
    this.unsubscribeRoom();
    this.subscribeRoomMessages(roomId);
    this.subscribeRoomReadStates(roomId);
    this.subscribeRoomTyping(roomId);
    this.currentRoomIdRef = roomId;
  }

  leaveRoom(): void {
    console.log("[PingMe] Leaving current room");
    this.unsubscribeRoom();
    this.currentRoomIdRef = null;
  }

  // =================================================================
  // Private - Subscription Management
  // =================================================================
  private setupSubscriptions(): void {
    console.log("[PingMe] Setting up subscriptions...");
    this.cleanupAllSubscriptions();
    this.setupChatSubscriptions();
    this.setupGlobalSubscriptions();

    if (this.currentRoomIdRef !== null) {
      this.resubscribeCurrentRoom();
    }
  }

  private resubscribeCurrentRoom(): void {
    if (this.currentRoomIdRef === null) return;
    console.log("[PingMe] Resubscribing to room:", this.currentRoomIdRef);
    this.subscribeRoomMessages(this.currentRoomIdRef);
    this.subscribeRoomReadStates(this.currentRoomIdRef);
    this.subscribeRoomTyping(this.currentRoomIdRef);
  }

  private parsePayload<T>(message: IMessage, context: string): T | null {
    try {
      return JSON.parse(message.body) as T;
    } catch (err) {
      console.error(`[PingMe] Error parsing ${context}:`, err);
      return null;
    }
  }

  private safeUnsubscribe(
    subscription: StompSubscription | null,
    context: string
  ): void {
    try {
      subscription?.unsubscribe();
    } catch (err) {
      console.warn(`[PingMe] Error unsubscribing ${context}:`, err);
    }
  }

  private setupChatSubscriptions(): void {
    if (!this.client) return;
    console.log("[PingMe] Setting up chat subscriptions");

    this.userRoomsSub = this.client.subscribe(
      "/user/queue/rooms",
      (msg: IMessage) => {
        try {
          const ev = JSON.parse(msg.body);

          switch (ev.chatEventType) {
            case "ROOM_CREATED":
              this.emit("ROOM_CREATED", ev);
              break;
            case "ROOM_UPDATED":
              this.emit("ROOM_UPDATED", ev);
              break;
            case "MEMBER_ADDED":
              this.emit("ROOM_MEMBER_ADDED", ev);
              break;
            case "MEMBER_REMOVED":
              this.emit("ROOM_MEMBER_REMOVED", ev);
              break;
            case "MEMBER_ROLE_CHANGED":
              this.emit("ROOM_MEMBER_ROLE_CHANGED", ev);
              break;
            default:
              console.warn("[PingMe] Unknown chat event:", ev);
          }
        } catch (err) {
          console.error("[PingMe] Error parsing chat event:", err);
        }
      }
    );
  }

  private setupGlobalSubscriptions(): void {
    if (!this.client) return;
    console.log("[PingMe] Setting up global subscriptions");

    this.statusSub = this.client.subscribe(
      "/user/queue/status",
      (msg: IMessage) => {
        try {
          const ev = JSON.parse(msg.body);
          this.emit("USER_STATUS", ev);
        } catch (err) {
          console.error("[PingMe] Error parsing status event:", err);
        }
      }
    );

    this.friendshipSub = this.client.subscribe(
      "/user/queue/friendship",
      (msg: IMessage) => {
        try {
          const ev = JSON.parse(msg.body);
          this.emit("FRIENDSHIP", ev);
        } catch (err) {
          console.error("[PingMe] Error parsing friendship event:", err);
        }
      }
    );
  }

  private subscribeRoomMessages(roomId: number): void {
    if (!this.isConnected() || !this.client) return;
    this.safeUnsubscribe(this.roomMsgSub, "room messages");

    const dest = `/topic/rooms/${roomId}/messages`;
    console.log("[PingMe] Subscribing to:", dest);

    this.roomMsgSub = this.client.subscribe(dest, (msg: IMessage) => {
      try {
        const ev = this.parsePayload<
          MessageCreatedEventPayload | MessageRecalledEventPayload
        >(msg, "message event");
        if (!ev) return;

        switch (ev.chatEventType) {
          case "MESSAGE_CREATED":
            this.options?.dispatch(
              messageCreated(ev as MessageCreatedEventPayload)
            );
            this.emit("MESSAGE_CREATED", ev as MessageCreatedEventPayload);
            break;
          case "MESSAGE_RECALLED":
            this.options?.dispatch(
              messageRecalled(ev as MessageRecalledEventPayload)
            );
            this.emit("MESSAGE_RECALLED", ev as MessageRecalledEventPayload);
            break;
        }
      } catch (err) {
        console.error("[PingMe] Error handling message event:", err);
      }
    });
  }

  private subscribeRoomReadStates(roomId: number): void {
    if (!this.isConnected() || !this.client) return;
    this.safeUnsubscribe(this.roomReadSub, "room read states");

    const dest = `/topic/rooms/${roomId}/read-states`;
    this.roomReadSub = this.client.subscribe(dest, (msg: IMessage) => {
      const ev = this.parsePayload<ReadStateChangedEvent>(
        msg,
        "read state event"
      );
      if (!ev || ev.chatEventType !== "READ_STATE_CHANGED") return;

      this.options?.dispatch(readStateChanged(ev));
      this.emit("READ_STATE_CHANGED", ev);
    });
  }

  private subscribeRoomTyping(roomId: number): void {
    if (!this.isConnected() || !this.client) return;
    this.safeUnsubscribe(this.roomTypingSub, "room typing");

    const dest = `/topic/rooms/${roomId}/typing`;
    this.roomTypingSub = this.client.subscribe(dest, (msg: IMessage) => {
      const ev = this.parsePayload<TypingSignalPayload>(msg, "typing event");
      if (!ev) return;

      this.options?.dispatch(userTyping(ev));
      this.emit("USER_TYPING", ev);
    });
  }

  private unsubscribeRoom(): void {
    this.safeUnsubscribe(this.roomMsgSub, "room messages");
    this.safeUnsubscribe(this.roomReadSub, "room read states");
    this.safeUnsubscribe(this.roomTypingSub, "room typing");
    this.roomMsgSub = null;
    this.roomReadSub = null;
    this.roomTypingSub = null;
  }

  private cleanupAllSubscriptions(): void {
    console.log("[PingMe] Cleaning up all subscriptions");
    this.safeUnsubscribe(this.userRoomsSub, "user rooms");
    this.safeUnsubscribe(this.roomMsgSub, "room messages");
    this.safeUnsubscribe(this.roomReadSub, "room read states");
    this.safeUnsubscribe(this.roomTypingSub, "room typing");
    this.safeUnsubscribe(this.statusSub, "status");
    this.safeUnsubscribe(this.friendshipSub, "friendship");

    this.userRoomsSub = null;
    this.roomMsgSub = null;
    this.roomReadSub = null;
    this.roomTypingSub = null;
    this.statusSub = null;
    this.friendshipSub = null;
  }
}

export const SocketManager = new SocketManagerClass();
