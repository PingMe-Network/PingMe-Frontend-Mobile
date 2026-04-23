import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface CreatePollModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[], allowMultiple: boolean) => void;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

export default function CreatePollModal({
  visible,
  loading = false,
  onClose,
  onSubmit,
}: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setQuestion("");
    setOptions(["", ""]);
    setAllowMultiple(false);
  }, [visible]);

  const sanitizedOptions = useMemo(
    () => options.map((item) => item.trim()).filter((item) => item.length > 0),
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

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(question.trim(), sanitizedOptions, allowMultiple);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              style={styles.keyboardAvoidingContainer}
              behavior={Platform.OS === "ios" ? "padding" : "padding"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 8}
            >
              <View style={styles.container}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  <View style={styles.header}>
                    <Text style={styles.title}>Tạo bình chọn</Text>
                    <TouchableOpacity onPress={onClose} disabled={loading}>
                      <Text style={styles.closeText}>Đóng</Text>
                    </TouchableOpacity>
                  </View>

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
                    <View key={`poll-option-${index}`} style={styles.optionRow}>
                      <TextInput
                        style={[styles.input, styles.optionInput]}
                        value={option}
                        onChangeText={(value) => updateOption(index, value)}
                        placeholder={`Lựa chọn ${index + 1}`}
                        placeholderTextColor="#9CA3AF"
                        editable={!loading}
                      />
                      {options.length > MIN_OPTIONS && (
                        <TouchableOpacity
                          onPress={() => removeOption(index)}
                          style={styles.removeBtn}
                          disabled={loading}
                        >
                          <Text style={styles.removeBtnText}>Xóa</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {options.length < MAX_OPTIONS && (
                    <TouchableOpacity onPress={addOption} style={styles.addBtn} disabled={loading}>
                      <Text style={styles.addBtnText}>+ Thêm lựa chọn</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Cho phép chọn nhiều đáp án</Text>
                    <Switch
                      value={allowMultiple}
                      onValueChange={setAllowMultiple}
                      disabled={loading}
                    />
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
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  closeText: {
    color: "#6B7280",
    fontWeight: "600",
  },
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
