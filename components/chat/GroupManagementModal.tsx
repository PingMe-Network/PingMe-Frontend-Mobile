import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { RoomParticipantResponse, RoomResponse } from "@/types/chat/room";
import {
  addGroupMembersApi,
  changeMemberRoleApi,
  dissolveGroupApi,
  leaveGroupApi,
  removeGroupMemberApi,
  renameGroupApi,
  updateGroupImageApi,
} from "@/services/chat";
import { getAcceptedFriendshipHistoryListApi } from "@/services/friendship";
import type { UserSummaryResponse } from "@/types/common/userSummary";

interface GroupManagementModalProps {
  visible: boolean;
  room: RoomResponse;
  currentUserId: number;
  onClose: () => void;
  onRoomUpdated: (room: RoomResponse) => void;
  onLeftOrDissolved: () => void;
}

type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

const roleLabel: Record<MemberRole, string> = {
  OWNER: "Trưởng nhóm",
  ADMIN: "Quản trị viên",
  MEMBER: "Thành viên",
};

export default function GroupManagementModal({
  visible,
  room,
  currentUserId,
  onClose,
  onRoomUpdated,
  onLeftOrDissolved,
}: GroupManagementModalProps) {
  const resolveRoomFromApiResponse = (response: any): RoomResponse | null => {
    const payload = response?.data?.data;
    const candidate = payload?.roomId ? payload : payload?.roomResponse;
    if (!candidate || typeof candidate.roomId !== "number" || !Array.isArray(candidate.participants)) {
      return null;
    }
    return candidate as RoomResponse;
  };

  const [newGroupName, setNewGroupName] = useState(room.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImage, setPendingImage] = useState<
    { uri: string; name: string; type: string } | null | undefined
  >(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(room.roomImgUrl || null);

  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [isMainInputFocused, setIsMainInputFocused] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [isFriendSearchFocused, setIsFriendSearchFocused] = useState(false);
  const [friendList, setFriendList] = useState<UserSummaryResponse[]>([]);
  const [friendHasMore, setFriendHasMore] = useState(true);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNewGroupName(room.name || "");
    setPendingImage(undefined);
    setPreviewImage(room.roomImgUrl || null);
    setShowAddMembersModal(false);
    setIsMainInputFocused(false);
    setFriendSearch("");
    setIsFriendSearchFocused(false);
    setFriendList([]);
    setFriendHasMore(true);
    setSelectedFriendIds([]);
    setShowLeaveModal(false);
    setSelectedNewOwnerId(null);
  }, [visible, room.name, room.roomImgUrl]);

  const myParticipant = useMemo(
    () => room.participants.find((participant) => participant.userId === currentUserId),
    [room.participants, currentUserId]
  );
  const myRole = myParticipant?.role || "MEMBER";
  const isOwner = myRole === "OWNER";
  const canManageGroup = myRole === "OWNER" || myRole === "ADMIN";

  const sortedParticipants = useMemo(() => {
    const roleOrder: Record<MemberRole, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2 };
    return [...room.participants].sort(
      (a, b) => roleOrder[a.role as MemberRole] - roleOrder[b.role as MemberRole]
    );
  }, [room.participants]);

  const eligibleNewOwners = useMemo(
    () => room.participants.filter((participant) => participant.userId !== currentUserId),
    [room.participants, currentUserId]
  );

  const loadFriends = async (beforeId?: number) => {
    if (isLoadingFriends || !friendHasMore) return;
    setIsLoadingFriends(true);
    try {
      const response = await getAcceptedFriendshipHistoryListApi(beforeId, 20);
      const data = response.data.data;
      setFriendList((prev) =>
        beforeId ? [...prev, ...data.userSummaryResponses] : data.userSummaryResponses
      );
      setFriendHasMore(data.hasMore);
    } catch (error: any) {
      Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không tải được danh sách bạn bè.");
    } finally {
      setIsLoadingFriends(false);
    }
  };

  useEffect(() => {
    if (!showAddMembersModal) return;
    setFriendList([]);
    setFriendHasMore(true);
    setSelectedFriendIds([]);
    void loadFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddMembersModal]);

  const availableFriends = useMemo(() => {
    const currentMemberIds = new Set(room.participants.map((participant) => participant.userId));
    return friendList.filter((friend) => {
      if (currentMemberIds.has(friend.id)) return false;
      if (!friendSearch.trim()) return true;
      return friend.name.toLowerCase().includes(friendSearch.toLowerCase());
    });
  }, [friendList, room.participants, friendSearch]);

  const runWithLoading = async (fn: () => Promise<void>) => {
    setIsSubmitting(true);
    try {
      await fn();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      Alert.alert("Lỗi", "Tên nhóm không được để trống.");
      return;
    }
    if (trimmed === (room.name || "")) {
      Alert.alert("Thông báo", "Tên nhóm không thay đổi.");
      return;
    }

    try {
      await runWithLoading(async () => {
        const response = await renameGroupApi(room.roomId, trimmed);
        const nextRoom = resolveRoomFromApiResponse(response);
        if (nextRoom) {
          onRoomUpdated(nextRoom);
        }
        Alert.alert("Thành công", "Đã đổi tên nhóm.");
      });
    } catch (error: any) {
      Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không thể đổi tên nhóm.");
    }
  };

  const handlePickGroupImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setPreviewImage(asset.uri);
    setPendingImage({
      uri: asset.uri,
      name: asset.fileName || `group_${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });
  };

  const handleRemoveGroupImage = () => {
    setPreviewImage(null);
    setPendingImage(null);
  };

  const handleSaveGroupImage = async () => {
    if (pendingImage === undefined) {
      Alert.alert("Thông báo", "Ảnh nhóm chưa thay đổi.");
      return;
    }

    try {
      await runWithLoading(async () => {
        const response = await updateGroupImageApi(room.roomId, pendingImage);
        const nextRoom = resolveRoomFromApiResponse(response);
        if (!nextRoom) {
          Alert.alert("Lỗi", "Dữ liệu phòng chat trả về không hợp lệ.");
          return;
        }
        onRoomUpdated(nextRoom);
        setPendingImage(undefined);
        Alert.alert("Thành công", "Đã cập nhật ảnh nhóm.");
      });
    } catch (error: any) {
      Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không thể cập nhật ảnh nhóm.");
    }
  };

  const canRemoveMember = (participant: RoomParticipantResponse) => {
    if (participant.userId === currentUserId) return false;
    if (participant.role === "OWNER") return false;
    if (myRole === "OWNER") return true;
    return myRole === "ADMIN" && participant.role === "MEMBER";
  };

  const getRoleActions = (participant: RoomParticipantResponse) => {
    if (!isOwner || participant.userId === currentUserId) return [];
    if (participant.role === "MEMBER") {
      return [
        { role: "ADMIN" as MemberRole, label: "Nâng lên Admin" },
        { role: "OWNER" as MemberRole, label: "Chuyển quyền Owner" },
      ];
    }
    if (participant.role === "ADMIN") {
      return [
        { role: "MEMBER" as MemberRole, label: "Hạ xuống Member" },
        { role: "OWNER" as MemberRole, label: "Chuyển quyền Owner" },
      ];
    }
    return [];
  };

  const handleChangeRole = async (participant: RoomParticipantResponse, role: MemberRole) => {
    const confirmText =
      role === "OWNER"
        ? `Chuyển quyền trưởng nhóm cho ${participant.name}?`
        : `Đổi vai trò của ${participant.name} thành ${roleLabel[role]}?`;

    Alert.alert("Xác nhận", confirmText, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý",
        onPress: () => {
          void (async () => {
            try {
              await runWithLoading(async () => {
                const response = await changeMemberRoleApi(room.roomId, participant.userId, role);
                const nextRoom = resolveRoomFromApiResponse(response);
                if (nextRoom) {
                  onRoomUpdated(nextRoom);
                }
                // If ownership is transferred, close modal to avoid stale control state.
                if (role === "OWNER" && participant.userId !== currentUserId) {
                  onClose();
                }
                Alert.alert("Thành công", "Đã cập nhật vai trò thành viên.");
              });
            } catch (error: any) {
              Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không thể đổi vai trò thành viên.");
            }
          })();
        },
      },
    ]);
  };

  const handleRemoveMember = (participant: RoomParticipantResponse) => {
    Alert.alert(
      "Xóa thành viên",
      `Bạn có chắc muốn xóa ${participant.name} khỏi nhóm?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            void runWithLoading(async () => {
              const response = await removeGroupMemberApi(room.roomId, participant.userId);
              const nextRoom = resolveRoomFromApiResponse(response);
              if (!nextRoom) {
                Alert.alert("Lỗi", "Dữ liệu phòng chat trả về không hợp lệ.");
                return;
              }
              onRoomUpdated(nextRoom);
              Alert.alert("Thành công", "Đã xóa thành viên khỏi nhóm.");
            });
          },
        },
      ]
    );
  };

  const handleToggleSelectedFriend = (friendId: number) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedFriendIds.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một thành viên.");
      return;
    }

    try {
      await runWithLoading(async () => {
        const response = await addGroupMembersApi({
          roomId: room.roomId,
          memberIds: selectedFriendIds,
        });
        const nextRoom = resolveRoomFromApiResponse(response);
        if (!nextRoom) {
          Alert.alert("Lỗi", "Dữ liệu phòng chat trả về không hợp lệ.");
          return;
        }
        onRoomUpdated(nextRoom);
        setShowAddMembersModal(false);
        setSelectedFriendIds([]);
        Alert.alert("Thành công", "Đã thêm thành viên vào nhóm.");
      });
    } catch (error: any) {
      Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không thể thêm thành viên vào nhóm.");
    }
  };

  const handleLeaveGroup = async () => {
    if (isOwner && eligibleNewOwners.length > 0 && !selectedNewOwnerId) {
      Alert.alert("Thông báo", "Bạn cần chọn trưởng nhóm mới trước khi rời nhóm.");
      return;
    }

    try {
      await runWithLoading(async () => {
        await leaveGroupApi(room.roomId, {
          newOwnerId: isOwner && eligibleNewOwners.length > 0 ? selectedNewOwnerId : null,
        });
        setShowLeaveModal(false);
        onClose();
        onLeftOrDissolved();
      });
    } catch (error: any) {
      Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không thể rời nhóm.");
    }
  };

  const handleDissolveGroup = () => {
    Alert.alert("Giải tán nhóm", "Bạn chắc chắn muốn giải tán nhóm này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Giải tán",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await runWithLoading(async () => {
                const wait = (ms: number) =>
                  new Promise<void>((resolve) => {
                    setTimeout(resolve, ms);
                  });

                let lastError: any = null;
                for (let attempt = 0; attempt < 3; attempt += 1) {
                  try {
                    await dissolveGroupApi(room.roomId);
                    onClose();
                    onLeftOrDissolved();
                    return;
                  } catch (error: any) {
                    lastError = error;
                    const status = error?.response?.status;
                    if (status === 409 && attempt < 2) {
                      await wait((attempt + 1) * 600);
                      continue;
                    }
                    break;
                  }
                }

                throw lastError;
              });
            } catch (error: any) {
              Alert.alert("Lỗi", error?.response?.data?.errorMessage || "Không thể giải tán nhóm.");
            }
          })();
        },
      },
    ]);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
                enabled={isMainInputFocused}
              >
                <View style={styles.container}>
                  <View style={styles.header}>
                    <Text style={styles.title}>Quản lý nhóm</Text>
                    <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                      <Text style={styles.closeText}>Đóng</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin nhóm</Text>
                    <View style={styles.imageRow}>
                      {previewImage ? (
                        <Image source={{ uri: previewImage }} style={styles.groupImage} />
                      ) : (
                        <View style={[styles.groupImage, styles.groupImagePlaceholder]}>
                          <Text style={styles.groupImageFallback}>
                            {(room.name || "G").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.imageActions}>
                        <TouchableOpacity
                          style={styles.secondaryBtn}
                          onPress={handlePickGroupImage}
                          disabled={isSubmitting}
                        >
                          <Text style={styles.secondaryBtnText}>Chọn ảnh</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.secondaryBtn}
                          onPress={handleRemoveGroupImage}
                          disabled={isSubmitting}
                        >
                          <Text style={styles.secondaryBtnText}>Xóa ảnh</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={handleSaveGroupImage}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Lưu ảnh nhóm</Text>
                      )}
                    </TouchableOpacity>

                    <TextInput
                      style={styles.input}
                      value={newGroupName}
                      onChangeText={setNewGroupName}
                      onFocus={() => setIsMainInputFocused(true)}
                      onBlur={() => setIsMainInputFocused(false)}
                      editable={!isSubmitting}
                      placeholder="Nhập tên nhóm mới"
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={handleRenameGroup}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Đổi tên nhóm</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.section}>
                    <View style={styles.membersHeader}>
                      <Text style={styles.sectionTitle}>Thành viên ({room.participants.length})</Text>
                      {canManageGroup && (
                        <TouchableOpacity
                          style={styles.smallActionBtn}
                          onPress={() => setShowAddMembersModal(true)}
                          disabled={isSubmitting}
                        >
                          <Text style={styles.smallActionBtnText}>+ Thêm</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {sortedParticipants.map((participant) => (
                      <View key={participant.userId} style={styles.memberCard}>
                        <View style={styles.memberInfo}>
                          {participant.avatarUrl ? (
                            <Image source={{ uri: participant.avatarUrl }} style={styles.memberAvatar} />
                          ) : (
                            <View style={[styles.memberAvatar, styles.memberAvatarFallback]}>
                              <Text style={styles.memberAvatarText}>
                                {participant.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={styles.memberTextBox}>
                            <Text style={styles.memberName} numberOfLines={1}>
                              {participant.name}
                              {participant.userId === currentUserId ? " (Bạn)" : ""}
                            </Text>
                            <Text style={styles.memberRole}>{roleLabel[participant.role as MemberRole]}</Text>
                          </View>
                        </View>

                        <View style={styles.memberActions}>
                          {getRoleActions(participant).map((action) => (
                            <TouchableOpacity
                              key={`${participant.userId}-${action.role}`}
                              style={styles.memberActionBtn}
                              onPress={() => handleChangeRole(participant, action.role)}
                              disabled={isSubmitting}
                            >
                              <Text style={styles.memberActionText}>{action.label}</Text>
                            </TouchableOpacity>
                          ))}
                          {canRemoveMember(participant) && (
                            <TouchableOpacity
                              style={[styles.memberActionBtn, styles.dangerActionBtn]}
                              onPress={() => handleRemoveMember(participant)}
                              disabled={isSubmitting}
                            >
                              <Text style={[styles.memberActionText, styles.dangerActionText]}>Xóa khỏi nhóm</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nhóm</Text>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, styles.fullWidthBtn]}
                      onPress={() => setShowLeaveModal(true)}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.secondaryBtnText}>Rời nhóm</Text>
                    </TouchableOpacity>
                    {isOwner && (
                      <TouchableOpacity
                        style={[styles.secondaryBtn, styles.fullWidthBtn, styles.dissolveBtn]}
                        onPress={handleDissolveGroup}
                        disabled={isSubmitting}
                      >
                        <Text style={styles.dissolveBtnText}>Giải tán nhóm</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showAddMembersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMembersModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddMembersModal(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
                enabled={isFriendSearchFocused}
              >
                <View style={styles.container}>
                  <View style={styles.header}>
                    <Text style={styles.title}>Thêm thành viên</Text>
                    <TouchableOpacity onPress={() => setShowAddMembersModal(false)}>
                      <Text style={styles.closeText}>Đóng</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input}
                    value={friendSearch}
                    onChangeText={setFriendSearch}
                    onFocus={() => setIsFriendSearchFocused(true)}
                    onBlur={() => setIsFriendSearchFocused(false)}
                    placeholder="Tìm bạn bè..."
                    placeholderTextColor="#9CA3AF"
                  />

                  <FlatList
                    data={availableFriends}
                    keyExtractor={(item) => `friend-${item.id}`}
                    keyboardShouldPersistTaps="handled"
                    onEndReachedThreshold={0.2}
                    onEndReached={() => {
                      if (!friendHasMore || isLoadingFriends || friendList.length === 0) return;
                      const last = friendList[friendList.length - 1];
                      if (last) {
                        void loadFriends(last.id);
                      }
                    }}
                    renderItem={({ item }) => {
                      const selected = selectedFriendIds.includes(item.id);
                      return (
                        <TouchableOpacity
                          style={[styles.friendRow, selected && styles.friendRowSelected]}
                          onPress={() => handleToggleSelectedFriend(item.id)}
                        >
                          {item.avatarUrl ? (
                            <Image source={{ uri: item.avatarUrl }} style={styles.memberAvatar} />
                          ) : (
                            <View style={[styles.memberAvatar, styles.memberAvatarFallback]}>
                              <Text style={styles.memberAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                            </View>
                          )}
                          <Text style={styles.friendName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                            {selected && <Text style={styles.checkboxTick}>✓</Text>}
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    ListEmptyComponent={
                      isLoadingFriends ? (
                        <View style={styles.emptyBlock}>
                          <ActivityIndicator size="small" color="#DF40A3" />
                        </View>
                      ) : (
                        <View style={styles.emptyBlock}>
                          <Text style={styles.emptyText}>Không có bạn bè khả dụng để thêm.</Text>
                        </View>
                      )
                    }
                    ListFooterComponent={
                      isLoadingFriends ? (
                        <View style={styles.footerLoader}>
                          <ActivityIndicator size="small" color="#DF40A3" />
                        </View>
                      ) : null
                    }
                  />

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleAddMembers}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Thêm thành viên đã chọn</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowLeaveModal(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.leaveContainer}>
                <Text style={styles.leaveTitle}>Rời nhóm</Text>
                <Text style={styles.leaveDesc}>
                  {isOwner && eligibleNewOwners.length > 0
                    ? "Bạn là trưởng nhóm, hãy chọn trưởng nhóm mới trước khi rời."
                    : "Bạn có chắc muốn rời nhóm chat này?"}
                </Text>

                {isOwner && eligibleNewOwners.length > 0 && (
                  <View style={styles.newOwnerList}>
                    {eligibleNewOwners.map((participant) => {
                      const selected = selectedNewOwnerId === participant.userId;
                      return (
                        <TouchableOpacity
                          key={`new-owner-${participant.userId}`}
                          style={[styles.newOwnerRow, selected && styles.newOwnerRowSelected]}
                          onPress={() => setSelectedNewOwnerId(participant.userId)}
                        >
                          <Text style={styles.newOwnerName} numberOfLines={1}>
                            {participant.name}
                          </Text>
                          <Text style={styles.newOwnerRole}>{roleLabel[participant.role as MemberRole]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={styles.leaveActions}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowLeaveModal(false)}>
                    <Text style={styles.secondaryBtnText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryBtn, styles.leaveConfirmBtn]} onPress={handleLeaveGroup}>
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Xác nhận rời nhóm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
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
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  content: {
    gap: 12,
    paddingBottom: 28,
  },
  section: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  groupImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  groupImagePlaceholder: {
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  groupImageFallback: {
    color: "#7E22CE",
    fontWeight: "700",
    fontSize: 22,
  },
  imageActions: {
    flexDirection: "row",
    gap: 8,
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
  },
  primaryBtn: {
    backgroundColor: "#DF40A3",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  secondaryBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 13,
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
  },
  smallActionBtnText: {
    color: "#7E22CE",
    fontSize: 12,
    fontWeight: "700",
  },
  memberCard: {
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 10,
    padding: 8,
    gap: 8,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  memberAvatarFallback: {
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    color: "#374151",
    fontWeight: "700",
  },
  memberTextBox: {
    flex: 1,
  },
  memberName: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 13,
  },
  memberRole: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 1,
  },
  memberActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  memberActionBtn: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  memberActionText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "600",
  },
  dangerActionBtn: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  dangerActionText: {
    color: "#B91C1C",
  },
  fullWidthBtn: {
    width: "100%",
  },
  dissolveBtn: {
    backgroundColor: "#FEE2E2",
  },
  dissolveBtnText: {
    color: "#B91C1C",
    fontWeight: "700",
    fontSize: 13,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  friendRowSelected: {
    backgroundColor: "#FDF2F8",
  },
  friendName: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
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
  emptyBlock: {
    paddingVertical: 18,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
  },
  footerLoader: {
    paddingVertical: 8,
    alignItems: "center",
  },
  leaveContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  leaveTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  leaveDesc: {
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 18,
  },
  newOwnerList: {
    maxHeight: 220,
    gap: 6,
  },
  newOwnerRow: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  newOwnerRowSelected: {
    borderColor: "#DF40A3",
    backgroundColor: "#FDF2F8",
  },
  newOwnerName: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 13,
  },
  newOwnerRole: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
  },
  leaveActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  leaveConfirmBtn: {
    flex: 1,
  },
});
