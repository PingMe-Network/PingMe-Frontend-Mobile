import { Platform } from "react-native";
import EventEmitter from "eventemitter3";
import ZegoExpressEngine, {
  ZegoPublishChannel,
  ZegoEngineProfile,
  ZegoScenario,
  ZegoRoomConfig,
  ZegoUser,
  ZegoView,
  ZegoViewMode,
  ZegoUpdateType,
  type ZegoStream,
} from "zego-express-engine-reactnative";
import type { CallType } from "@/types/call/call";

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

type AttachRemoteViewParams = {
  remoteViewTag?: number;
};

class ZegoCallEngineService extends EventEmitter {
  private engine: ZegoExpressEngine | null = null;
  private currentRoomKey: string | null = null;
  private localStreamId: string | null = null;
  private remoteStreamId: string | null = null;
  private remoteViewTag?: number;
  private initializedAppId?: number;
  private operationId = 0;
  private lifecycleLock: Promise<void> = Promise.resolve();

  override on(event: string | symbol, fn: (...args: any[]) => void, context?: any): any {
    super.on(event, fn, context);
    return (() => {
      this.off(event, fn, context);
    }) as any;
  }

  private toRoomKeys(roomId: number) {
    const normalized = String(roomId);
    const legacy = `call_${roomId}`;
    return normalized === legacy ? [normalized] : [normalized, legacy];
  }

  private toStreamId(roomId: number, userId: number) {
    return `stream_${roomId}_${userId}`;
  }

  private createVideoView(reactTag?: number) {
    if (!reactTag) return undefined;
    return new ZegoView(reactTag, ZegoViewMode.AspectFill, 0x000000);
  }

  private ensureSupportedPlatform() {
    if (Platform.OS === "web") {
      throw new Error("ZEGO media engine is not supported on web");
    }
  }

  private registerEngineEvents() {
    if (!this.engine) return;

    this.engine.on("roomStateChanged", (roomID, reason, errorCode) => {
      this.emit("room-state", { roomID, reason, errorCode });
    });

    this.engine.on("roomStreamUpdate", async (_roomID, updateType, streamList) => {
      if (updateType === ZegoUpdateType.Add) {
        const remote = streamList.find((stream) => stream.streamID !== this.localStreamId);
        if (!remote) return;

        this.remoteStreamId = remote.streamID;
        this.emit("remote-stream-added", remote.streamID);

        try {
          await this.startPlayingRemoteStream(remote.streamID);
        } catch (error) {
          this.emit("error", error);
        }
        return;
      }

      if (updateType === ZegoUpdateType.Delete) {
        const deleted = streamList.find((stream) => stream.streamID === this.remoteStreamId);
        if (!deleted) return;

        if (this.remoteStreamId) {
          await this.engine?.stopPlayingStream(this.remoteStreamId).catch(() => {});
        }

        this.remoteStreamId = null;
        this.emit("remote-stream-removed");
      }
    });

    this.engine.on("publisherStateUpdate", (_streamID, state, errorCode) => {
      this.emit("publisher-state", { state, errorCode });
    });

    this.engine.on("playerStateUpdate", (streamID, state, errorCode) => {
      this.emit("player-state", { streamID, state, errorCode });
    });
  }

  private async ensureEngine(appId: number, appSign: string, callType: CallType) {
    this.ensureSupportedPlatform();

    if (this.engine && this.initializedAppId === appId) return this.engine;

    if (this.engine) {
      await ZegoExpressEngine.destroyEngine().catch(() => {});
      this.engine = null;
      this.initializedAppId = undefined;
    }

    const scenario =
      callType === "VIDEO" ? ZegoScenario.StandardVideoCall : ZegoScenario.StandardVoiceCall;

    this.engine = await ZegoExpressEngine.createEngineWithProfile(
      new ZegoEngineProfile(appId, appSign, scenario)
    );

    this.initializedAppId = appId;
    this.registerEngineEvents();

    return this.engine;
  }

  private async startPlayingRemoteStream(streamID: string) {
    if (!this.engine) return;

    const remoteView = this.createVideoView(this.remoteViewTag);
    await this.engine.startPlayingStream(streamID, remoteView, undefined);
  }

  private assertOperationActive(operationId: number) {
    if (operationId !== this.operationId || !this.engine) {
      throw new Error("ZEGO operation aborted");
    }
  }

  private runWithLifecycleLock<T>(task: () => Promise<T>): Promise<T> {
    const run = this.lifecycleLock.then(task, task);
    this.lifecycleLock = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private isNativeNullEngineError(error: unknown) {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return (
      message.includes("setcustomaudioprocesshandler") &&
      message.includes("null object reference")
    );
  }

  private async hardResetEngine() {
    try {
      if (this.remoteStreamId) {
        await this.engine?.stopPlayingStream(this.remoteStreamId).catch(() => {});
      }

      if (this.localStreamId) {
        await this.engine?.stopPublishingStream(ZegoPublishChannel.Main).catch(() => {});
      }

      await this.engine?.stopPreview(ZegoPublishChannel.Main).catch(() => {});

      if (this.currentRoomKey) {
        await this.engine?.logoutRoom(this.currentRoomKey).catch(() => {});
      }
    } catch {
      // no-op: best effort cleanup before destroy
    }

    this.remoteStreamId = null;
    this.localStreamId = null;
    this.currentRoomKey = null;
    this.remoteViewTag = undefined;

    await ZegoExpressEngine.destroyEngine().catch(() => {});
    this.engine = null;
    this.initializedAppId = undefined;
  }

  async joinAndStart(params: JoinCallParams) {
    return this.runWithLifecycleLock(async () => {
      const { appId, appSign, roomId, userId, userName, callType, roomToken, localViewTag } = params;
      const operationId = ++this.operationId;
      const roomCandidates = this.toRoomKeys(roomId);

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const engine = await this.ensureEngine(appId, appSign, callType);
          this.assertOperationActive(operationId);

          this.localStreamId = this.toStreamId(roomId, userId);

          const roomConfig = new ZegoRoomConfig(0, true, roomToken ?? "");
          const user = new ZegoUser(String(userId), userName || `user_${userId}`);

          let loginError: unknown;
          this.currentRoomKey = null;

          for (const roomKey of roomCandidates) {
            try {
              await engine.loginRoom(roomKey, user, roomConfig);
              this.currentRoomKey = roomKey;
              break;
            } catch (error) {
              loginError = error;
            }
          }

          if (!this.currentRoomKey) {
            throw loginError ?? new Error("Failed to login ZEGO room");
          }

          this.assertOperationActive(operationId);

          await engine.setAudioRouteToSpeaker(callType === "VIDEO");
          this.assertOperationActive(operationId);

          await engine.enableCamera(callType === "VIDEO", ZegoPublishChannel.Main);
          this.assertOperationActive(operationId);

          if (callType === "VIDEO") {
            const localView = this.createVideoView(localViewTag);
            await engine.startPreview(localView, ZegoPublishChannel.Main);
            this.assertOperationActive(operationId);
          }

          await engine.startPublishingStream(this.localStreamId, ZegoPublishChannel.Main, undefined);
          this.assertOperationActive(operationId);

          this.emit("joined", {
            roomKey: this.currentRoomKey,
            localStreamId: this.localStreamId,
          });
          return;
        } catch (error) {
          if (attempt === 0 && this.isNativeNullEngineError(error)) {
            console.warn("[Call][ZEGO] Native null engine detected, hard reset and retry once.");
            await this.hardResetEngine();
            continue;
          }
          throw error;
        }
      }
    });
  }

  async attachRemoteView({ remoteViewTag }: AttachRemoteViewParams) {
    this.remoteViewTag = remoteViewTag;

    if (!this.remoteViewTag || !this.remoteStreamId) return;
    await this.engine?.stopPlayingStream(this.remoteStreamId).catch(() => {});
    await this.startPlayingRemoteStream(this.remoteStreamId);
  }

  async setMicrophoneMuted(muted: boolean) {
    if (!this.engine) return;
    await this.engine.muteMicrophone(muted);
    await this.engine.mutePublishStreamAudio(muted, ZegoPublishChannel.Main);
  }

  async setSpeakerEnabled(enabled: boolean) {
    if (!this.engine) return;
    await this.engine.setAudioRouteToSpeaker(enabled);
  }

  async setCameraEnabled(enabled: boolean) {
    if (!this.engine) return;
    await this.engine.enableCamera(enabled, ZegoPublishChannel.Main);
    await this.engine.mutePublishStreamVideo(!enabled, ZegoPublishChannel.Main);
  }

  async leave() {
    ++this.operationId;

    return this.runWithLifecycleLock(async () => {
      if (!this.engine) return;

      if (this.remoteStreamId) {
        await this.engine.stopPlayingStream(this.remoteStreamId).catch(() => {});
      }

      if (this.localStreamId) {
        await this.engine.stopPublishingStream(ZegoPublishChannel.Main).catch(() => {});
      }

      await this.engine.stopPreview(ZegoPublishChannel.Main).catch(() => {});

      if (this.currentRoomKey) {
        await this.engine.logoutRoom(this.currentRoomKey).catch(() => {});
      }

      this.remoteStreamId = null;
      this.localStreamId = null;
      this.currentRoomKey = null;
      this.remoteViewTag = undefined;

      await ZegoExpressEngine.destroyEngine().catch(() => {});
      this.engine = null;
      this.initializedAppId = undefined;
    });
  }
}

export const ZegoCallEngine = new ZegoCallEngineService();
