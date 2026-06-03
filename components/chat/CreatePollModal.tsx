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

interface CreatePollModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[], allowMultiple: boolean) => void;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;
const createInitialOptions = (): PollOption[] => [
  { id: 1, value: "" },
  { id: 2, value: "" },
];

interface PollOption {
  id: number;
  value: string;
}

interface PollOptionRowProps {
  index: number;
  option: PollOption;
  canRemove: boolean;
  loading: boolean;
  onChangeOption: (id: number, value: string) => void;
  onRemoveOption: (id: number) => void;
}

function PollOptionRow({
  index,
  option,
  canRemove,
  loading,
  onChangeOption,
  onRemoveOption,
}: Readonly<PollOptionRowProps>) {
  const handleChangeText = (value: string) => {
    onChangeOption(option.id, value);
  };

  const handleRemove = () => {
    onRemoveOption(option.id);
  };

  return (
    <View style={styles.optionRow}>
      <TextInput
        style={[styles.input, styles.optionInput]}
        value={option.value}
        onChangeText={handleChangeText}
        placeholder={`Lựa chọn ${index + 1}`}
        placeholderTextColor="#9CA3AF"
        editable={!loading}
      />
      {canRemove && (
        <TouchableOpacity onPress={handleRemove} style={styles.removeBtn} disabled={loading}>
          <Text style={styles.removeBtnText}>Xóa</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function CreatePollModal({
  visible,
  loading = false,
  onClose,
  onSubmit,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<PollOption[]>(createInitialOptions);
  const [allowMultiple, setAllowMultiple] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setQuestion("");
    setOptions(createInitialOptions());
    setAllowMultiple(false);
  }, [visible]);

  const sanitizedOptions = useMemo(
    () => options.map((item) => item.value.trim()).filter((item) => item.length > 0),
    [options]
  );

  const hasDuplicateOptions = useMemo(() => {
    const normalized = sanitizedOptions.map((item) => item.toLowerCase());
    return new Set(normalized).size !== normalized.length;
  }, [sanitizedOptions]);

  const canSubmit =
    question.trim().length > 0 &&
    sanitizedOptions.length >= MIN_OPTIONS &&
    !hasDuplicateOptions &&
    !loading;

  const updateOption = (id: number, value: string) => {
    setOptions((prev) => prev.map((option) => (option.id === id ? { ...option, value } : option)));
  };

  const removeOption = (id: number) => {
    setOptions((prev) => prev.filter((option) => option.id !== id));
  };

  const addOption = () => {
    setOptions((prev) => {
      const lastId = prev.at(-1)?.id ?? 0;
      return [...prev, { id: lastId + 1, value: "" }];
    });
  };

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(question.trim(), sanitizedOptions, allowMultiple);
  };

  return (
    <ChatFormModalShell
      visible={visible}
      title="Tạo bình chọn"
      loading={loading}
      maxHeight="85%"
      onClose={onClose}
    >
      <Text style={styles.label}>Câu hỏi</Text>
      <TextInput
        style={styles.input}
        value={question}
        onChangeText={setQuestion}
        placeholder="Nhập câu hỏi bình chọn"
        placeholderTextColor="#9CA3AF"
        editable={!loading}
      />

      <Text style={styles.label}>Lựa chọn</Text>
      {options.map((option, index) => (
        <PollOptionRow
          key={`poll-option-${option.id}`}
          index={index}
          option={option}
          canRemove={options.length > MIN_OPTIONS}
          loading={loading}
          onChangeOption={updateOption}
          onRemoveOption={removeOption}
        />
      ))}
      {options.length < MAX_OPTIONS && (
        <TouchableOpacity
          onPress={addOption}
          style={styles.addBtn}
          disabled={loading}
        >
          <Text style={styles.addBtnText}>+ Thêm lựa chọn</Text>
        </TouchableOpacity>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Cho phép chọn nhiều đáp án</Text>
        <Switch value={allowMultiple} onValueChange={setAllowMultiple} disabled={loading} />
      </View>

      {hasDuplicateOptions && (
        <Text style={styles.errorText}>Các lựa chọn không được trùng nhau.</Text>
      )}

      <TouchableOpacity
        onPress={submit}
        disabled={!canSubmit}
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>Tạo bình chọn</Text>
        )}
      </TouchableOpacity>
    </ChatFormModalShell>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
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
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionInput: {
    flex: 1,
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  removeBtnText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
  },
  addBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
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
    fontWeight: "500",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 2,
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
