import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { MessageResponse } from "@/types/chat/message";
import { votePollApi } from "@/services/chat";

interface MessagePollProps {
  message: MessageResponse;
  currentUserId?: number;
  isMine: boolean;
  onMessageUpdated?: (message: MessageResponse) => void;
}

export default function MessagePoll({
  message,
  currentUserId,
  isMine,
  onMessageUpdated,
}: MessagePollProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[] | null>(null);

  const poll = message.poll;
  if (!poll) return null;

  const currentSelected = !currentUserId
    ? []
    : poll.options
        .filter((option) => option.voterIds.includes(currentUserId))
        .map((option) => option.id);

  const selectedIds = localSelected ?? currentSelected;
  const isExpired =
    poll.expired ||
    (!!poll.expiresAt && new Date(poll.expiresAt).getTime() < Date.now());
  const canVote = message.isActive && !isExpired;

  const onToggle = async (optionId: string) => {
    if (!canVote || isVoting) return;
    let nextSelected: string[];

    if (poll.allowMultiple) {
      nextSelected = selectedIds.includes(optionId)
        ? selectedIds.filter((id) => id !== optionId)
        : [...selectedIds, optionId];
    } else {
      nextSelected = selectedIds.includes(optionId) ? [] : [optionId];
    }

    setLocalSelected(nextSelected);
    setIsVoting(true);
    try {
      const res = await votePollApi(message.id, { optionIds: nextSelected });
      onMessageUpdated?.(res.data.data);
      setLocalSelected(null);
    } catch (error: any) {
      setLocalSelected(null);
      Alert.alert(
        "Lỗi",
        error?.response?.data?.errorMessage || "Không thể bình chọn."
      );
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.question, isMine && styles.questionMine]}>{poll.question}</Text>

      <View style={styles.typeRow}>
        <Text style={[styles.metaText, isMine && styles.metaTextMine]}>
          {poll.allowMultiple ? "Chọn nhiều" : "Chọn một"}
        </Text>
        {isExpired && (
          <Text style={[styles.expiredBadge, isMine && styles.expiredBadgeMine]}>
            Hết hạn
          </Text>
        )}
      </View>

      <View style={styles.optionsWrapper}>
        {poll.options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const percentage =
            poll.totalVotes > 0
              ? Math.round((option.voteCount / poll.totalVotes) * 100)
              : 0;

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.9}
              onPress={() => onToggle(option.id)}
              disabled={!canVote || isVoting}
              style={[
                styles.optionBtn,
                isMine && styles.optionBtnMine,
                isSelected && styles.optionBtnSelected,
                isSelected && isMine && styles.optionBtnSelectedMine,
              ]}
            >
              <View
                style={[
                  styles.progressBg,
                  { width: `${percentage}%` },
                  isMine && styles.progressBgMine,
                ]}
              />
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.checkCircle,
                      poll.allowMultiple && styles.checkSquare,
                      isSelected && styles.checkCircleSelected,
                    ]}
                  >
                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text
                    style={[styles.optionText, isMine && styles.optionTextMine]}
                  >
                    {option.text}
                  </Text>
                </View>
                {poll.totalVotes > 0 && option.voteCount > 0 && (
                  <Text style={[styles.voteCount, isMine && styles.voteCountMine]}>
                    {option.voteCount}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, isMine && styles.footerTextMine]}>
          {poll.totalVotes} phiếu
        </Text>
        {isVoting && <ActivityIndicator size="small" color={isMine ? "#FFFFFF" : "#DF40A3"} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 8,
  },
  question: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  questionMine: {
    color: "#FFFFFF",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  metaTextMine: {
    color: "rgba(255,255,255,0.8)",
  },
  expiredBadge: {
    fontSize: 10,
    color: "#B45309",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    fontWeight: "700",
  },
  expiredBadgeMine: {
    color: "#7C2D12",
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  optionsWrapper: {
    gap: 6,
  },
  optionBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  optionBtnMine: {
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  optionBtnSelected: {
    borderColor: "#DF40A3",
  },
  optionBtnSelectedMine: {
    borderColor: "#FFFFFF",
  },
  progressBg: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(223,64,163,0.14)",
  },
  progressBgMine: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  optionContent: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkSquare: {
    borderRadius: 4,
  },
  checkCircleSelected: {
    borderColor: "#DF40A3",
    backgroundColor: "#DF40A3",
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  optionText: {
    flex: 1,
    color: "#111827",
    fontSize: 13,
    fontWeight: "500",
  },
  optionTextMine: {
    color: "#FFFFFF",
  },
  voteCount: {
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
  voteCountMine: {
    color: "#FFFFFF",
  },
  footerRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  footerTextMine: {
    color: "rgba(255,255,255,0.85)",
  },
});
