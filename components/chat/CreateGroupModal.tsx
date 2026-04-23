import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { createGroupRoomApi } from "@/services/chat";
import { getAcceptedFriendshipHistoryListApi } from "@/services/friendship";
import type { UserSummaryResponse } from "@/types/common/userSummary";
import type { RoomResponse } from "@/types/chat/room";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (room: RoomResponse) => void;
}

export default function CreateGroupModal({
  visible,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<UserSummaryResponse[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setGroupName("");
    setSearchQuery("");
    setFriends([]);
    setSelectedMemberIds([]);
    setHasMore(true);
    void (async () => {
      setIsLoadingFriends(true);
      try {
        const response = await getAcceptedFriendshipHistoryListApi(undefined, 20);
        const data = response.data.data;
        setFriends(data.userSummaryResponses);
        setHasMore(data.hasMore);
      } catch (error: any) {
        Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không tải được danh sách bạn bè.");
      } finally {
        setIsLoadingFriends(false);
      }
    })();
  }, [visible]);

  const loadFriends = async (beforeId?: number) => {
    if (isLoadingFriends) return;
    if (beforeId && !hasMore) return;

    setIsLoadingFriends(true);
    try {
      const response = await getAcceptedFriendshipHistoryListApi(beforeId, 20);
      const data = response.data.data;
      setFriends((prev) =>
        beforeId ? [...prev, ...data.userSummaryResponses] : data.userSummaryResponses
      );
      setHasMore(data.hasMore);
    } catch (error: any) {
      Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không tải được danh sách bạn bè.");
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const availableFriends = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return friends;
    return friends.filter((friend) => friend.name.toLowerCase().includes(keyword));
  }, [friends, searchQuery]);

  const selectedMembers = useMemo(
    () => friends.filter((friend) => selectedMemberIds.includes(friend.id)),
    [friends, selectedMemberIds]
  );

  const toggleSelectedMember = (friendId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleCreateGroup = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      Alert.alert("Lỗi", "Vui lòng nhập tên nhóm.");
      return;
    }
    if (selectedMemberIds.length < 2) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất 2 thành viên.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createGroupRoomApi({
        name: trimmedName,
        memberIds: selectedMemberIds,
      });
      onGroupCreated(response.data.data);
      onClose();
    } catch (error: any) {
      Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không thể tạo nhóm chat.");
    } finally {
      setIsSubmitting(false);
    }
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
                <View style={styles.header}>
                  <Text style={styles.title}>Tạo nhóm chat</Text>
                  <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                    <Text style={styles.closeText}>Đóng</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên nhóm"
                  placeholderTextColor="#9CA3AF"
                  value={groupName}
                  onChangeText={setGroupName}
                  editable={!isSubmitting}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Tìm bạn bè..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  editable={!isSubmitting}
                />

                <Text style={styles.subTitle}>Đã chọn ({selectedMemberIds.length})</Text>
                {selectedMembers.length > 0 ? (
                  <View style={styles.selectedList}>
                    {selectedMembers.map((member) => (
                      <TouchableOpacity
                        key={`selected-${member.id}`}
                        style={styles.selectedChip}
                        onPress={() => toggleSelectedMember(member.id)}
                      >
                        <Text style={styles.selectedChipText} numberOfLines={1}>
                          {member.name}
                        </Text>
                        <Text style={styles.removeText}>×</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptySelectedText}>Chưa chọn thành viên nào.</Text>
                )}

                <Text style={styles.subTitle}>Bạn bè</Text>
                <FlatList
                  data={availableFriends}
                  keyExtractor={(item) => `friend-${item.id}`}
                  style={styles.friendList}
                  keyboardShouldPersistTaps="handled"
                  onEndReachedThreshold={0.25}
                  onEndReached={() => {
                    if (!hasMore || isLoadingFriends || friends.length === 0) return;
                    const last = friends[friends.length - 1];
                    if (last) void loadFriends(last.id);
                  }}
                  renderItem={({ item }) => {
                    const isSelected = selectedMemberIds.includes(item.id);
                    return (
                      <TouchableOpacity
                        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
                        onPress={() => toggleSelectedMember(item.id)}
                      >
                        <Text style={styles.friendName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    isLoadingFriends ? (
                      <View style={styles.loaderWrap}>
                        <ActivityIndicator size="small" color="#DF40A3" />
                      </View>
                    ) : (
                      <View style={styles.loaderWrap}>
                        <Text style={styles.emptyText}>Không có bạn bè phù hợp.</Text>
                      </View>
                    )
                  }
                  ListFooterComponent={
                    isLoadingFriends && availableFriends.length > 0 ? (
                      <View style={styles.loaderWrap}>
                        <ActivityIndicator size="small" color="#DF40A3" />
                      </View>
                    ) : null
                  }
                />

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleCreateGroup}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Tạo nhóm</Text>
                  )}
                </TouchableOpacity>
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
    maxHeight: "88%",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 18,
  },
  closeText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: "#111827",
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  subTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 6,
  },
  selectedList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    minHeight: 34,
    marginBottom: 4,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: "100%",
  },
  selectedChipText: {
    color: "#6D28D9",
    fontWeight: "600",
    fontSize: 12,
    maxWidth: 160,
  },
  removeText: {
    color: "#6D28D9",
    fontWeight: "700",
    marginLeft: 6,
  },
  emptySelectedText: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 4,
  },
  friendList: {
    maxHeight: 260,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginBottom: 12,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  friendItemSelected: {
    backgroundColor: "#FDF2F8",
  },
  friendName: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    borderColor: "#DF40A3",
    backgroundColor: "#DF40A3",
  },
  checkboxTick: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
  },
  loaderWrap: {
    paddingVertical: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
  },
  submitBtn: {
    backgroundColor: "#DF40A3",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
