import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ChatFormModalShell from "@/components/chat/ChatFormModalShell";

export type NoteReminderSubmitPayload =
  | { type: "NOTE"; body: string; pinToTop: boolean }
  | {
      type: "REMINDER";
      body: string;
      remindAt: string;
      timezone: string;
      repeatRule: string;
    };

interface CreateNoteReminderModalProps {
  visible: boolean;
  mode: "NOTE" | "REMINDER";
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: NoteReminderSubmitPayload) => void;
}

type QuickOption =
  | { label: string; minutes: number }
  | { label: string; tomorrowAtHour: number };

const QUICK_OPTIONS: QuickOption[] = [
  { label: "15 phút nữa", minutes: 15 },
  { label: "30 phút nữa", minutes: 30 },
  { label: "9:00 ngày mai", tomorrowAtHour: 9 },
];

const REPEAT_OPTIONS = [
  { label: "Không lặp lại", value: "NONE" },
  { label: "Hằng ngày", value: "DAILY" },
  { label: "Hằng tuần", value: "WEEKLY" },
  { label: "Hằng tháng", value: "MONTHLY" },
];

interface ChoiceChipProps {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function ChoiceChip({ label, selected, disabled = false, onPress }: Readonly<ChoiceChipProps>) {
  return (
    <TouchableOpacity
      style={[styles.quickChip, selected && styles.quickChipSelected]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.quickChipText, selected && styles.quickChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function toDateTimeLocalValue(date: Date) {
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toReminderPayloadValue(value: string) {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

function formatReminderDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CreateNoteReminderModal({
  visible,
  mode,
  loading = false,
  onClose,
  onSubmit,
}: Readonly<CreateNoteReminderModalProps>) {
  const [body, setBody] = useState("");
  const [pinToTop, setPinToTop] = useState(false);
  const [remindAt, setRemindAt] = useState("");
  const [repeatRule, setRepeatRule] = useState("NONE");
  const [selectedQuickIndex, setSelectedQuickIndex] = useState(1);
  const isReminder = mode === "REMINDER";

  useEffect(() => {
    if (!visible) return;
    setBody("");
    setPinToTop(false);
    setRepeatRule("NONE");
    setSelectedQuickIndex(1);
    setRemindAt(toDateTimeLocalValue(new Date(Date.now() + 30 * 60 * 1000)));
  }, [visible, mode]);

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const canSubmit =
    body.trim().length > 0 &&
    !loading &&
    (!isReminder || new Date(remindAt).getTime() > Date.now());

  const applyQuickOption = (option: QuickOption, index: number) => {
    const next = new Date();
    if ("minutes" in option) {
      next.setMinutes(next.getMinutes() + option.minutes);
    } else {
      next.setDate(next.getDate() + 1);
      next.setHours(option.tomorrowAtHour, 0, 0, 0);
    }
    setRemindAt(toDateTimeLocalValue(next));
    setSelectedQuickIndex(index);
  };

  const submit = () => {
    if (!canSubmit) return;
    const trimmedBody = body.trim();

    if (!isReminder) {
      onSubmit({ type: "NOTE", body: trimmedBody, pinToTop });
      return;
    }

    onSubmit({
      type: "REMINDER",
      body: trimmedBody,
      remindAt: toReminderPayloadValue(remindAt),
      timezone,
      repeatRule,
    });
  };

  return (
    <ChatFormModalShell
      visible={visible}
      title={isReminder ? "Tạo nhắc hẹn" : "Tạo ghi chú"}
      loading={loading}
      maxHeight="88%"
      onClose={onClose}
    >
      <Text style={styles.label}>Nội dung</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={body}
        onChangeText={setBody}
        placeholder="Nhập nội dung mới hoặc dán link"
        placeholderTextColor="#9CA3AF"
        editable={!loading}
        multiline
        maxLength={2000}
        textAlignVertical="top"
      />

      {isReminder ? (
        <ReminderFields
          loading={loading}
          remindAt={remindAt}
          repeatRule={repeatRule}
          selectedQuickIndex={selectedQuickIndex}
          onQuickSelect={applyQuickOption}
          onReminderDateChange={(value) => {
            setRemindAt(value);
            setSelectedQuickIndex(-1);
          }}
          onRepeatRuleChange={setRepeatRule}
        />
      ) : (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Ghim lên đầu trò chuyện</Text>
          <Switch value={pinToTop} onValueChange={setPinToTop} disabled={loading} />
        </View>
      )}

      {isReminder && remindAt && new Date(remindAt).getTime() <= Date.now() ? (
        <Text style={styles.errorText}>Thời gian nhắc hẹn phải ở tương lai.</Text>
      ) : null}

      <TouchableOpacity
        onPress={submit}
        disabled={!canSubmit}
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>
            {isReminder ? "Tạo nhắc hẹn" : "Tạo ghi chú"}
          </Text>
        )}
      </TouchableOpacity>
    </ChatFormModalShell>
  );
}

interface ReminderFieldsProps {
  loading: boolean;
  remindAt: string;
  repeatRule: string;
  selectedQuickIndex: number;
  onQuickSelect: (option: QuickOption, index: number) => void;
  onReminderDateChange: (value: string) => void;
  onRepeatRuleChange: (value: string) => void;
}

function ReminderFields({
  loading,
  remindAt,
  repeatRule,
  selectedQuickIndex,
  onQuickSelect,
  onReminderDateChange,
  onRepeatRuleChange,
}: Readonly<ReminderFieldsProps>) {
  return (
    <>
      <Text style={styles.label}>Chọn thời gian</Text>
      <View style={styles.quickRow}>
        {QUICK_OPTIONS.map((option, index) => (
          <ChoiceChip
            key={option.label}
            label={option.label}
            selected={selectedQuickIndex === index}
            onPress={() => onQuickSelect(option, index)}
            disabled={loading}
          />
        ))}
      </View>

      <TextInput
        style={styles.input}
        value={remindAt}
        onChangeText={onReminderDateChange}
        placeholder="YYYY-MM-DDTHH:mm"
        placeholderTextColor="#9CA3AF"
        editable={!loading}
      />
      <Text style={styles.helperText}>{formatReminderDate(remindAt)}</Text>

      <Text style={styles.label}>Lặp lại</Text>
      <View style={styles.quickRow}>
        {REPEAT_OPTIONS.map((option) => (
          <ChoiceChip
            key={option.value}
            label={option.label}
            selected={repeatRule === option.value}
            onPress={() => onRepeatRuleChange(option.value)}
            disabled={loading}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: 140,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  quickChipSelected: {
    backgroundColor: "#F3E8FF",
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  quickChipTextSelected: {
    color: "#7C3AED",
  },
  helperText: {
    color: "#6B7280",
    fontSize: 12,
  },
  switchRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
  },
  submitBtn: {
    marginTop: 8,
    backgroundColor: "#DF40A3",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
