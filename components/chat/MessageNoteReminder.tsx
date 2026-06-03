import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Bell, CheckCircle2, Clock, StickyNote } from "lucide-react-native";
import type { MessageResponse, ReminderStatus } from "@/types/chat/message";

interface MessageNoteReminderProps {
  message: MessageResponse;
  isMine: boolean;
}

const STATUS_LABEL: Record<ReminderStatus, string> = {
  PENDING: "Đang chờ",
  TRIGGERED: "Đã nhắc",
  DONE: "Hoàn tất",
  CANCELED: "Đã hủy",
};

function formatReminderDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageNoteReminder({
  message,
  isMine,
}: Readonly<MessageNoteReminderProps>) {
  const isReminder = message.type === "REMINDER";
  const note = message.note;
  const reminder = message.reminder;
  const title = isReminder
    ? reminder?.title || message.content || "Nhắc hẹn"
    : note?.title || message.content || "Ghi chú";
  const body = isReminder ? reminder?.body : note?.body;
  const remindAt = formatReminderDate(reminder?.remindAt);
  const status = reminder?.status || "PENDING";

  return (
    <View
      style={[
        styles.card,
        isReminder ? styles.reminderCard : styles.noteCard,
        isMine && styles.mineCard,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconBox, isReminder ? styles.reminderIcon : styles.noteIcon]}>
          {isReminder ? (
            <Bell size={18} color="#B45309" />
          ) : (
            <StickyNote size={18} color="#6D28D9" />
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.kicker}>{isReminder ? "NHẮC HẸN" : "GHI CHÚ"}</Text>
          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}

          {isReminder ? (
            <View style={styles.metaRow}>
              {remindAt ? (
                <View style={styles.metaPill}>
                  <Clock size={12} color="#4B5563" />
                  <Text style={styles.metaText}>{remindAt}</Text>
                </View>
              ) : null}
              <View style={styles.metaPill}>
                <CheckCircle2 size={12} color="#4B5563" />
                <Text style={styles.metaText}>{STATUS_LABEL[status]}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 230,
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  noteCard: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  reminderCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  mineCard: {
    backgroundColor: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  noteIcon: {
    backgroundColor: "#EDE9FE",
  },
  reminderIcon: {
    backgroundColor: "#FEF3C7",
  },
  content: {
    flex: 1,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0,
  },
  title: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  body: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    color: "#374151",
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
  },
});
