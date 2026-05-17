import {
  AESEncryptionKey,
  AESSealedData,
  CryptoDigestAlgorithm,
  aesDecryptAsync,
  aesEncryptAsync,
  digest,
  getRandomBytes,
} from "expo-crypto";
import { TextDecoder, TextEncoder } from "text-encoding";
import type { MessageResponse } from "@/types/chat/message";
import type { RoomResponse } from "@/types/chat/room";

const ENCRYPTED_TEXT_PREFIX = "pmenc:v1:";
const KEY_MATERIAL_PREFIX = "pingme:text-message:v1";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export const MAX_ENCRYPTED_TEXT_CONTENT_LENGTH = 1000;
export const ENCRYPTED_TEXT_PREVIEW = "Tin nhắn mã hóa";
export const DECRYPT_TEXT_FAILURE = "Không thể giải mã tin nhắn";

const Encoder = (globalThis as any).TextEncoder ?? TextEncoder;
const Decoder = (globalThis as any).TextDecoder ?? TextDecoder;
const encoder: { encode(input?: string): Uint8Array } = new Encoder();
const decoder: { decode(input?: ArrayBuffer | Uint8Array): string } = new Decoder();

export function isEncryptedTextContent(content?: string | null): content is string {
  return typeof content === "string" && content.startsWith(ENCRYPTED_TEXT_PREFIX);
}

export function getRoomTextEncryptionMaterial(room: RoomResponse): string {
  const participantIds = room.participants
    .map((participant) => participant.userId)
    .sort((a, b) => a - b)
    .join(",");

  return [
    KEY_MATERIAL_PREFIX,
    `room:${room.roomId}`,
    `type:${room.roomType}`,
    `direct:${room.directKey ?? ""}`,
    `participants:${participantIds}`,
  ].join("|");
}

export async function encryptTextMessageContent(
  plaintext: string,
  room: RoomResponse
): Promise<string> {
  const key = await deriveAesKey(room);
  const iv = getRandomBytes(IV_LENGTH);
  const sealedData = await aesEncryptAsync(encoder.encode(plaintext), key, {
    nonce: { bytes: iv },
    tagLength: TAG_LENGTH,
  });
  const ciphertextWithTag = await sealedData.ciphertext({
    encoding: "bytes",
    includeTag: true,
  });

  return `${ENCRYPTED_TEXT_PREFIX}${toBase64Url(iv)}.${toBase64Url(ciphertextWithTag)}`;
}

export async function decryptTextMessageContent(
  content: string,
  room: RoomResponse
): Promise<string> {
  if (!isEncryptedTextContent(content)) {
    return content;
  }

  const payload = content.slice(ENCRYPTED_TEXT_PREFIX.length);
  const [ivPart, ciphertextPart] = payload.split(".");
  if (!ivPart || !ciphertextPart) {
    throw new Error("Invalid encrypted text payload");
  }

  const key = await deriveAesKey(room);
  const sealedData = AESSealedData.fromParts(
    fromBase64Url(ivPart),
    fromBase64Url(ciphertextPart),
    TAG_LENGTH
  );
  const decrypted = await aesDecryptAsync(sealedData, key, { output: "bytes" });

  return decoder.decode(decrypted);
}

export async function decryptTextMessageForRoom(
  message: MessageResponse,
  room: RoomResponse
): Promise<MessageResponse> {
  let content = message.content;
  let repliedMessage = message.repliedMessage;
  const isEncryptedText =
    message.isEncryptedText || (message.type === "TEXT" && isEncryptedTextContent(content));

  if (message.type === "TEXT" && isEncryptedTextContent(content)) {
    content = await decryptSafely(content, room);
  }

  if (
    repliedMessage?.type === "TEXT" &&
    repliedMessage.content &&
    isEncryptedTextContent(repliedMessage.content)
  ) {
    repliedMessage = {
      ...repliedMessage,
      content: await decryptSafely(repliedMessage.content, room),
    };
  }

  if (
    content === message.content &&
    repliedMessage === message.repliedMessage &&
    isEncryptedText === message.isEncryptedText
  ) {
    return message;
  }

  return {
    ...message,
    content,
    repliedMessage,
    isEncryptedText,
  };
}

export async function decryptTextMessagesForRoom(
  messages: MessageResponse[],
  room: RoomResponse
): Promise<MessageResponse[]> {
  return Promise.all(messages.map((message) => decryptTextMessageForRoom(message, room)));
}

async function decryptSafely(content: string, room: RoomResponse): Promise<string> {
  try {
    return await decryptTextMessageContent(content, room);
  } catch (error) {
    console.warn("[ChatCrypto] Failed to decrypt text message", error);
    return DECRYPT_TEXT_FAILURE;
  }
}

async function deriveAesKey(room: RoomResponse): Promise<AESEncryptionKey> {
  const material = toArrayBufferBackedBytes(encoder.encode(getRoomTextEncryptionMaterial(room)));
  const digestBuffer = await digest(CryptoDigestAlgorithm.SHA256, material);
  return (await AESEncryptionKey.import(new Uint8Array(digestBuffer))) as AESEncryptionKey;
}

function toArrayBufferBackedBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(bytes.length));
  copy.set(bytes);
  return copy;
}

function toBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return base64ToBytes(padded);
}

function bytesToBase64(bytes: Uint8Array): string {
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

    output += BASE64_ALPHABET[(triplet >>> 18) & 0x3f];
    output += BASE64_ALPHABET[(triplet >>> 12) & 0x3f];
    output += i + 1 < bytes.length ? BASE64_ALPHABET[(triplet >>> 6) & 0x3f] : "=";
    output += i + 2 < bytes.length ? BASE64_ALPHABET[triplet & 0x3f] : "=";
  }
  return output;
}

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/g, "");
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i += 4) {
    const char1 = BASE64_ALPHABET.indexOf(clean[i]);
    const char2 = BASE64_ALPHABET.indexOf(clean[i + 1]);
    const char3 = i + 2 < clean.length ? BASE64_ALPHABET.indexOf(clean[i + 2]) : 0;
    const char4 = i + 3 < clean.length ? BASE64_ALPHABET.indexOf(clean[i + 3]) : 0;

    if (char1 < 0 || char2 < 0 || char3 < 0 || char4 < 0) {
      throw new Error("Invalid base64 payload");
    }

    const triplet = (char1 << 18) | (char2 << 12) | (char3 << 6) | char4;
    bytes.push((triplet >>> 16) & 0xff);
    if (i + 2 < clean.length) bytes.push((triplet >>> 8) & 0xff);
    if (i + 3 < clean.length) bytes.push(triplet & 0xff);
  }

  return new Uint8Array(bytes);
}
