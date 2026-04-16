import { Client, type StompSubscription } from "@stomp/stompjs";
import "react-native-url-polyfill/auto";
import { getTokens } from "@/utils/storage";
import { isTokenExpired } from "@/utils/jwtDecode";
import EventEmitter from "eventemitter3";
import {
  messageCreated,
  messageRecalled,
  messageUpdated,
  userTyping,
  readStateChanged,
} from "./chatSlice";

// Polyfill for TextEncoder/Decoder
import { TextEncoder, TextDecoder } from "text-encoding";
if ((globalThis as any).TextEncoder === "undefined") {
  (globalThis as any).TextEncoder = TextEncoder;
  (globalThis as any).TextDecoder = TextDecoder;
}

export interface SocketManagerOptions {
  baseUrl: string;
  dispatch: any;
  onConnect?: () => void;
  onDisconnect?: (reason?: string) => void;
}

class SocketManagerClass extends EventEmitter {
  private client: Client | null = null;
  private options: SocketManagerOptions | null = null;
  private manualDisconnect = false;
  private connecting = false;

  // Subscriptions
  private userRoomsSub: StompSubscription | null = null;
  private statusSub: StompSubscription | null = null;
  private friendshipSub: StompSubscription | null = null;
  private callSignalingSub: StompSubscription | null = null;
  private callSub: StompSubscription | null = null;
  private roomMsgSub: StompSubscription | null = null;
  private roomReadSub: StompSubscription | null = null;
  private roomTypingSub: StompSubscription | null = null;

  private currentRoomIdRef: number | null = null;

  constructor() {
    super();
  }

  /**
   * Override on to return an unsubscribe function for easier cleanup in React effects.
   */
  override on(event: string | symbol, fn: (...args: any[]) => void, context?: any): any {
    super.on(event, fn, context);
    return (() => {
      this.off(event, fn, context);
    }) as any;
  }

  isConnected(): boolean {
    return !!this.client?.connected;
  }

  async connect(opts: SocketManagerOptions): Promise<void> {
    if (this.isConnected() || this.connecting) return;

    this.connecting = true;
    this.manualDisconnect = false;
    this.options = opts;

    const { accessToken } = await getTokens();
    if (!accessToken || isTokenExpired(accessToken, 5000)) {
      this.connecting = false;
      return;
    }

    this.client = new Client({
      webSocketFactory: () => {
        const SockJS = require("sockjs-client");
        const url = `${opts.baseUrl}/core-service/ws`;
        return new SockJS(url);
      },
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      heartbeatIncoming: 20000,
      heartbeatOutgoing: 20000,
      reconnectDelay: 10000,
    });

    this.client.onConnect = () => {
      this.connecting = false;
      this.setupSubscriptions();
      this.options?.onConnect?.();
    };

    this.client.onStompError = (frame) => {
      this.connecting = false;
    };

    this.client.onWebSocketError = () => {
      this.connecting = false;
    };

    this.client.onDisconnect = () => {
      this.connecting = false;
      if (this.manualDisconnect) {
        this.cleanupAllSubscriptions();
      }
    };

    this.client.activate();
  }

  disconnect(): void {
    if (this.manualDisconnect) return;
    this.manualDisconnect = true;
    this.client?.deactivate();
    this.client = null;
    this.connecting = false;
  }

  enterRoom(roomId: number): void {
    const rId = Number(roomId);
    this.currentRoomIdRef = rId;

    if (!this.isConnected()) {
      return;
    }

    this.subscribeRoom(rId);
  }

  leaveRoom(): void {
    this.unsubscribeRoom();
    this.currentRoomIdRef = null;
  }

  sendTyping(roomId: number, isTyping: boolean): void {
    if (!this.isConnected()) return;
    this.client?.publish({
      destination: `/app/rooms/${roomId}/typing`,
      body: JSON.stringify({ isTyping }),
    });
  }

  async sendMessage(
    roomId: number,
    payload: {
      content: string;
      clientMsgId: string;
      type: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
    },
    timeoutMs = 1500
  ): Promise<void> {
    if (!this.isConnected() || !this.client) {
      throw new Error("Socket is not connected");
    }

    await new Promise<void>((resolve, reject) => {
      let isDone = false;

      const finish = (error?: Error) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timer);
        unsub?.();

        if (error) {
          reject(error);
          return;
        }

        resolve();
      };

      const unsub = this.on("MESSAGE_EVENT", (ev: any) => {
        if (ev?.chatEventType !== "MESSAGE_CREATED") return;

        const message = ev?.messageResponse;
        if (!message) return;

        if (
          Number(message.roomId) === Number(roomId) &&
          String(message.clientMsgId) === String(payload.clientMsgId)
        ) {
          finish();
        }
      });

      const timer = setTimeout(() => {
        finish(new Error("Socket send message ack timeout"));
      }, timeoutMs);

      try {
        this.client?.publish({
          destination: `/app/rooms/${roomId}/messages`,
          body: JSON.stringify({
            roomId,
            content: payload.content,
            clientMsgId: payload.clientMsgId,
            type: payload.type,
          }),
        });
      } catch (error) {
        finish(error instanceof Error ? error : new Error("Socket publish failed"));
      }
    });
  }

  private subscribeRoom(roomId: number): void {
    this.unsubscribeRoom();
    this.roomMsgSub = this.client!.subscribe(`/topic/rooms/${roomId}/messages`, (msg) => {
      try {
        const ev = JSON.parse(msg.body);
        if (ev.chatEventType === "MESSAGE_CREATED") {
          this.options?.dispatch(messageCreated(ev));
        } else if (ev.chatEventType === "MESSAGE_RECALLED") {
          this.options?.dispatch(messageRecalled(ev));
        } else if (ev.chatEventType === "MESSAGE_UPDATED") {
          this.options?.dispatch(messageUpdated(ev));
        }
        this.emit("MESSAGE_EVENT", ev);
      } catch (e) {
        console.error("[PingMe] Parse error in room messages", e);
      }
    });

    this.roomReadSub = this.client!.subscribe(`/topic/rooms/${roomId}/read-states`, (msg) => {
      const ev = JSON.parse(msg.body);
      this.options?.dispatch(readStateChanged(ev));
      this.emit("READ_STATE", ev);
    });

    this.roomTypingSub = this.client!.subscribe(`/topic/rooms/${roomId}/typing`, (msg) => {
      const ev = JSON.parse(msg.body);
      this.options?.dispatch(userTyping(ev));
      this.emit("USER_TYPING", ev);
    });
  }

  private setupSubscriptions(): void {
    if (!this.client || !this.isConnected()) return;
    this.cleanupAllSubscriptions();

    this.userRoomsSub = this.client.subscribe("/user/queue/rooms", (msg) => {
      try {
        const ev = JSON.parse(msg.body);
        if (ev.chatEventType) {
          this.emit(ev.chatEventType, ev);
        }
        this.emit("ROOM_EVENT", ev);
      } catch (e) {
        console.error("[PingMe] Error parsing global room event", e);
      }
    });

    this.statusSub = this.client.subscribe("/user/queue/status", (msg) => {
      this.emit("USER_STATUS", JSON.parse(msg.body));
    });

    this.friendshipSub = this.client.subscribe("/user/queue/friendship", (msg) => {
      this.emit("FRIENDSHIP", JSON.parse(msg.body));
    });

    this.callSignalingSub = this.client.subscribe("/user/queue/signaling", (msg) => {
      try {
        const ev = JSON.parse(msg.body);
        this.emit("CALL_SIGNALING", ev);
      } catch (e) {
        console.error("[PingMe] Error parsing signaling event", e);
      }
    });

    // Backward compatibility for older backend topic naming.
    this.callSub = this.client.subscribe("/user/queue/call", (msg) => {
      try {
        const ev = JSON.parse(msg.body);
        this.emit("CALL_SIGNALING", ev);
      } catch (e) {
        console.error("[PingMe] Error parsing call event", e);
      }
    });

    if (this.currentRoomIdRef) {
      this.subscribeRoom(this.currentRoomIdRef);
    }
  }

  private unsubscribeRoom(): void {
    this.roomMsgSub?.unsubscribe();
    this.roomReadSub?.unsubscribe();
    this.roomTypingSub?.unsubscribe();
    this.roomMsgSub = null;
    this.roomReadSub = null;
    this.roomTypingSub = null;
  }

  private cleanupAllSubscriptions(): void {
    this.userRoomsSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.friendshipSub?.unsubscribe();
    this.callSignalingSub?.unsubscribe();
    this.callSub?.unsubscribe();
    this.unsubscribeRoom();
    this.userRoomsSub = null;
    this.statusSub = null;
    this.friendshipSub = null;
    this.callSignalingSub = null;
    this.callSub = null;
  }
}

export const SocketManager = new SocketManagerClass();
