import type { MessageResponse } from "@/types/chat/message";

/**
 * Adds a message to the list only if it doesn't already exist (by id or clientMsgId).
 * Returns the original array reference if the message is a duplicate.
 */
export function addUniqueMessage(
  prev: MessageResponse[],
  newMsg: MessageResponse
): MessageResponse[] {
  const hasId = prev.some((m) => m.id === newMsg.id);
  const hasClientId =
    newMsg.clientMsgId && prev.some((m) => m.clientMsgId === newMsg.clientMsgId);
  if (hasId || hasClientId) return prev;
  return [...prev, newMsg];
}
