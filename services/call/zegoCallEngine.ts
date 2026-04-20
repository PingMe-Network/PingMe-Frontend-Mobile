import { Platform } from "react-native";
import EventEmitter from "eventemitter3";
import type {
  ZegoPublishChannel,
  ZegoEngineProfile,
  ZegoScenario,
  ZegoRoomConfig,
  ZegoUser,
  ZegoView,
  ZegoViewMode,
  ZegoUpdateType,
} from "zego-express-engine-reactnative";
import type { default as ZegoExpressEngineType } from "zego-express-engine-reactnative";
import type { CallType } from "@/types/call/call";

// Lazy-load Zego native module only when actually needed.
function getZegoModule(): typeof import("zego-express-engine-reactnative") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("zego-express-engine-reactnative");
}

function getZego(): typeof ZegoExpressEngineType {
  return getZegoModule().default;
}

function makeEngineProfile(appId: number, appSign: string, scenario: ZegoScenario): ZegoEngineProfile {
  const { ZegoEngineProfile } = getZegoModule();
  return new ZegoEngineProfile(appId, appSign, scenario);
}

function makeRoomConfig(maxMemberCount: number, isUserStatusNotify: boolean, token: string): ZegoRoomConfig {
  const { ZegoRoomConfig } = getZegoModule();
  return new ZegoRoomConfig(maxMemberCount, isUserStatusNotify, token);
}

function makeUser(userId: string, userName: string): ZegoUser {
  const { ZegoUser } = getZegoModule();
  return new ZegoUser(userId, userName);
}

function getZegoEnums() {
  const mod = getZegoModule();
  return {
    ZegoPublishChannel: mod.ZegoPublishChannel,
    ZegoScenario: mod.ZegoScenario,
    ZegoViewMode: mod.ZegoViewMode,
    ZegoUpdateType: mod.ZegoUpdateType,
  };
}

type JoinCallParams = {
  appId: number;
  appSign: string;
  roomId: number;
  userId: number;
  userName: string;
  callType: CallType;
  roomToken?: string;
  localViewTag?: number;
};

// ── Multi-stream events ───────────────────────────────────────────────────────
// "remote-stream-added"   → { streamId: string }  (UI cần render ZegoTextureView mới)
// "remote-stream-removed" → { streamId: string }  (UI cần xóa ZegoTextureView)
// "room-state"            → { roomID, reason, errorCode }
// "publisher-state"       → { state, errorCode }
// "player-state"          → { streamID, state, errorCode }
// "joined"                → { roomKey, localStreamId }
// "error"                 → Error

class ZegoCallEngineService extends EventEmitter {
  private engine: ZegoExpressEngineType | null = null;
  private currentRoomKey: string | null = null;
  private localStreamId: string | null = null;
  private initializedAppId?: number;
  private operationId = 0;
  private lifecycleLock: Promise<void> = Promise.resolve();

  // streamId → viewTag (undefined = stream đã đến nhưng chưa có view)
  private remoteStreams: Map<string, number | undefined> = new Map();

  override on(event: string | symbol, fn: (...args: any[]) => void, context?: any): any {
    super.on(event, fn, context);
    return (() => { this.off(event, fn, context); }) as any;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private toRoomKeys(roomId: number) {
    const normalized = String(roomId);
    const legacy = `call_${roomId}`;
    return normalized === legacy ? [normalized] : [normalized, legacy];
  }

  private generateStreamId(roomId: string, userId: string) {
    return `${roomId}_${userId}_main`;
  }

  private createVideoView(viewTag?: number) {
    if (!viewTag) return undefined;
    const { ZegoView, ZegoViewMode } = getZegoModule();
    return new ZegoView(viewTag, ZegoViewMode.AspectFill, 0);
  }

  private ensureSupportedPlatform() {
    if (Platform.OS === "web") {
      throw new Error("ZEGO media engine is not supported on web");
    }
  }

  // ── Engine Events ──────────────────────────────────────────────────────────

  private registerEngineEvents() {
    if (!this.engine) return;

    this.engine.on("roomStateChanged", (roomID: any, reason: any, errorCode: any) => {
      this.emit("room-state", { roomID, reason, errorCode });
    });

    this.engine.on("roomStreamUpdate", async (_roomID: any, updateType: any, streamList: any[]) => {
      const { ZegoUpdateType } = getZegoEnums();

      if (updateType === ZegoUpdateType.Add) {
        // Lọc bỏ stream của chính mình
        const remoteStreams = streamList.filter(
          (s: any) => s.streamID !== this.localStreamId
        );

        for (const stream of remoteStreams) {
          const streamId: string = stream.streamID;
          if (this.remoteStreams.has(streamId)) continue; // đã có, bỏ qua

          this.remoteStreams.set(streamId, undefined);
          this.emit("remote-stream-added", { streamId });

          // Bắt đầu play ngay (audio hoạt động kể cả không có view)
          // Video sẽ được gắn vào view sau khi UI render xong
          try {
            await this.engine?.startPlayingStream(streamId, undefined, undefined);
          } catch (error) {
            this.emit("error", error);
          }
        }
        return;
      }

      if (updateType === ZegoUpdateType.Delete) {
        for (const stream of streamList) {
          const streamId: string = stream.streamID;
          if (!this.remoteStreams.has(streamId)) continue;

          await this.engine?.stopPlayingStream(streamId).catch(() => {});
          this.remoteStreams.delete(streamId);
          this.emit("remote-stream-removed", { streamId });
        }
      }
    });

    this.engine.on("publisherStateUpdate", (_streamID: any, state: any, errorCode: any) => {
      this.emit("publisher-state", { state, errorCode });
    });

    this.engine.on("playerStateUpdate", (streamID: any, state: any, errorCode: any) => {
      this.emit("player-state", { streamID, state, errorCode });
    });
  }

  // ── Engine Lifecycle ───────────────────────────────────────────────────────

  private async ensureEngine(appId: number, appSign: string, callType: CallType) {
    this.ensureSupportedPlatform();

    if (this.engine && this.initializedAppId === appId) return this.engine;

    if (this.engine) {
      await getZego().destroyEngine().catch(() => {});
      this.engine = null;
      this.initializedAppId = undefined;
    }

    const { ZegoScenario } = getZegoEnums();
    const scenario =
      callType === "VIDEO" ? ZegoScenario.StandardVideoCall : ZegoScenario.StandardVoiceCall;

    this.engine = await getZego().createEngineWithProfile(
      makeEngineProfile(appId, appSign, scenario)
    );

    this.initializedAppId = appId;
    this.registerEngineEvents();
    return this.engine;
  }

  private async loginToAnyRoom(
    engine: ZegoExpressEngineType,
    roomCandidates: string[],
    user: ZegoUser,
    roomConfig: ZegoRoomConfig,
  ) {
    let loginError: unknown;
    for (const roomKey of roomCandidates) {
      try {
        await engine.loginRoom(roomKey, user, roomConfig);
        return roomKey;
      } catch (error) {
        loginError = error;
      }
    }
    throw loginError ?? new Error("Failed to login ZEGO room");
  }

  private assertOperationActive(operationId: number) {
    if (operationId !== this.operationId || !this.engine) {
      throw new Error("ZEGO operation aborted");
    }
  }

  private runWithLifecycleLock<T>(task: () => Promise<T>): Promise<T> {
    const taskWithTimeout = async () => {
      return Promise.race([
        task(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("ZEGO operation timeout")), 15000)
        ),
      ]);
    };

    const run = this.lifecycleLock.then(taskWithTimeout, taskWithTimeout);
    this.lifecycleLock = run.then(() => undefined, () => undefined);
    return run;
  }

  private isNativeNullEngineError(error: unknown) {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return msg.includes("setcustomaudioprocesshandler") && msg.includes("null object reference");
  }

  private async stopAllRemoteStreams() {
    for (const streamId of this.remoteStreams.keys()) {
      await this.engine?.stopPlayingStream(streamId).catch(() => {});
    }
    this.remoteStreams.clear();
  }

  private async hardResetEngine() {
    try {
      await this.stopAllRemoteStreams();

      if (this.localStreamId) {
        const { ZegoPublishChannel } = getZegoEnums();
        await this.engine?.stopPublishingStream(ZegoPublishChannel.Main).catch(() => {});
      }

      const { ZegoPublishChannel: ZPC } = getZegoEnums();
      await this.engine?.stopPreview(ZPC.Main).catch(() => {});

      if (this.currentRoomKey) {
        await this.engine?.logoutRoom(this.currentRoomKey).catch(() => {});
      }
    } catch {
      // best-effort
    }

    this.localStreamId = null;
    this.currentRoomKey = null;

    await getZego().destroyEngine().catch(() => {});
    this.engine = null;
    this.initializedAppId = undefined;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async joinAndStart(params: JoinCallParams) {
    return this.runWithLifecycleLock(async () => {
      const { appId, appSign, roomId, userId, userName, callType, roomToken, localViewTag } = params;
      const operationId = ++this.operationId;
      const roomCandidates = this.toRoomKeys(roomId);

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const engine = await this.ensureEngine(appId, appSign, callType);
          this.assertOperationActive(operationId);

          this.localStreamId = this.generateStreamId(String(roomId), String(userId));

          const roomConfig = makeRoomConfig(0, true, roomToken ?? "");
          const user = makeUser(String(userId), userName || `user_${userId}`);
          this.currentRoomKey = null;

          this.currentRoomKey = await this.loginToAnyRoom(engine, roomCandidates, user, roomConfig);
          this.assertOperationActive(operationId);

          const { ZegoPublishChannel } = getZegoEnums();
          await engine.setAudioRouteToSpeaker(callType === "VIDEO");
          this.assertOperationActive(operationId);

          await engine.muteMicrophone(false);
          this.assertOperationActive(operationId);

          await engine.enableCamera(callType === "VIDEO", ZegoPublishChannel.Main);
          this.assertOperationActive(operationId);

          if (callType === "VIDEO") {
            await engine.enableHardwareEncoder(false);
            await engine.enableHardwareDecoder(false);
            await engine.useFrontCamera(true, ZegoPublishChannel.Main);
            await engine.mutePublishStreamVideo(false, ZegoPublishChannel.Main);
            await engine.setStreamExtraInfo(
              JSON.stringify({ isCameraOn: true, isMicrophoneOn: true, hasVideo: true, hasAudio: true }),
              ZegoPublishChannel.Main
            );
            await engine.setVideoConfig(
              { captureWidth: 720, captureHeight: 1280, encodeWidth: 720, encodeHeight: 1280, fps: 15, bitrate: 1500, codecID: 0 },
              ZegoPublishChannel.Main
            );
          }

          if (callType === "VIDEO") {
            const localView = this.createVideoView(localViewTag);
            await engine.startPreview(localView, ZegoPublishChannel.Main);
            this.assertOperationActive(operationId);
          }

          await engine.startPublishingStream(this.localStreamId, ZegoPublishChannel.Main, undefined);
          await engine.setStreamExtraInfo(
            JSON.stringify({
              isCameraOn: callType === "VIDEO",
              isMicrophoneOn: true,
              hasVideo: callType === "VIDEO",
              hasAudio: true,
            }),
            ZegoPublishChannel.Main
          );
          this.assertOperationActive(operationId);

          this.emit("joined", { roomKey: this.currentRoomKey, localStreamId: this.localStreamId });
          return;
        } catch (error) {
          if (attempt === 0 && this.isNativeNullEngineError(error)) {
            console.warn("[Call][ZEGO] Native null engine, hard reset and retry.");
            await this.hardResetEngine();
            continue;
          }
          throw error;
        }
      }
    });
  }

  /**
   * Gắn (hoặc re-gắn) một ZegoTextureView vào một remote stream.
   * UI gọi hàm này khi ZegoTextureView đã mount và có viewTag.
   */
  async attachStreamView(streamId: string, viewTag: number) {
    if (!this.engine) return;

    this.remoteStreams.set(streamId, viewTag);

    // Dừng rồi khởi động lại với view mới để native bridge latch đúng
    await this.engine.stopPlayingStream(streamId).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 50));

    const view = this.createVideoView(viewTag);
    await this.engine.startPlayingStream(streamId, view, undefined).catch((err) => {
      console.warn(`[Call][ZEGO] attachStreamView error for ${streamId}:`, err);
    });
  }

  /** Lấy danh sách streamId hiện tại (để UI sync khi reconnect) */
  getRemoteStreamIds(): string[] {
    return Array.from(this.remoteStreams.keys());
  }

  async setMicrophoneMuted(muted: boolean) {
    if (!this.engine) return;
    const { ZegoPublishChannel } = getZegoEnums();
    await this.engine.muteMicrophone(muted);
    await this.engine.mutePublishStreamAudio(muted, ZegoPublishChannel.Main);
  }

  async setSpeakerEnabled(enabled: boolean) {
    if (!this.engine) return;
    await this.engine.setAudioRouteToSpeaker(enabled);
  }

  async setCameraEnabled(enabled: boolean) {
    if (!this.engine) return;
    const { ZegoPublishChannel } = getZegoEnums();
    await this.engine.enableCamera(enabled, ZegoPublishChannel.Main);
    await this.engine.mutePublishStreamVideo(!enabled, ZegoPublishChannel.Main);
  }

  async leave() {
    ++this.operationId;

    return this.runWithLifecycleLock(async () => {
      if (!this.engine) return;

      await this.stopAllRemoteStreams();

      if (this.localStreamId) {
        const { ZegoPublishChannel } = getZegoEnums();
        await this.engine.stopPublishingStream(ZegoPublishChannel.Main).catch(() => {});
      }

      const { ZegoPublishChannel: ZPC } = getZegoEnums();
      await this.engine.stopPreview(ZPC.Main).catch(() => {});

      if (this.currentRoomKey) {
        await this.engine.logoutRoom(this.currentRoomKey).catch(() => {});
      }

      this.localStreamId = null;
      this.currentRoomKey = null;

      await getZego().destroyEngine().catch(() => {});
      this.engine = null;
      this.initializedAppId = undefined;
    });
  }
}

export const ZegoCallEngine = new ZegoCallEngineService();
