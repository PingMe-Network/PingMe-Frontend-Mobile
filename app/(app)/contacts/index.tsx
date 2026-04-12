import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  Users,
  UserPlus,
  Inbox,
  Send,
  UserMinus,
  Check,
  X,
  Clock,
  MessageCircle,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppSelector } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { SocketManager } from "@/features/chat";
import {
  getAcceptedFriendshipHistoryListApi,
  getReceivedHistoryInvitationsApi,
  getSentHistoryInvitationsApi,
  getUserFriendshipStatsApi,
  deleteFriendshipApi,
  acceptInvitationApi,
  rejectInvitationApi,
  cancelInvitationApi,
  lookupUserByEmailApi,
  sendInvitationApi,
} from "@/services/friendship";
import { createOrGetDirectRoomApi } from "@/services/chat";
import type { UserSummaryResponse } from "@/types/common/userSummary";
import type {
  UserFriendshipStatsResponse,
  FriendshipEventPayload,
} from "@/types/friendship";

type TabId = "friends" | "received" | "sent";

export default function ContactsScreen() {
  const { userSession } = useAppSelector((state) => state.auth);
  const tabBarHeight = useTabBarHeight();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<UserFriendshipStatsResponse>({
    totalFriends: 0,
    totalSentInvites: 0,
    totalReceivedInvites: 0,
  });

  const [friends, setFriends] = useState<UserSummaryResponse[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<UserSummaryResponse[]>([]);
  const [sentInvites, setSentInvites] = useState<UserSummaryResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<UserSummaryResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);

  useEffect(() => {
    getUserFriendshipStatsApi()
      .then((res) => setStats(res.data.data))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(
    async (tab: TabId, beforeId?: number, append = false) => {
      try {
        if (!append) setIsLoading(true);
        else setIsLoadingMore(true);

        let response: import("@/types/friendship").HistoryFriendshipResponse;
        switch (tab) {
          case "friends":
            response = (await getAcceptedFriendshipHistoryListApi(beforeId, 20)).data.data;
            if (append) {
              setFriends((prev) => {
                const ids = new Set(prev.map((f) => f.id));
                return [...prev, ...response.userSummaryResponses.filter((f) => !ids.has(f.id))];
              });
            } else setFriends(response.userSummaryResponses);
            break;
          case "received":
            response = (await getReceivedHistoryInvitationsApi(beforeId, 20)).data.data;
            if (append) {
              setReceivedInvites((prev) => {
                const ids = new Set(prev.map((f) => f.id));
                return [...prev, ...response.userSummaryResponses.filter((f) => !ids.has(f.id))];
              });
            } else setReceivedInvites(response.userSummaryResponses);
            break;
          case "sent":
            response = (await getSentHistoryInvitationsApi(beforeId, 20)).data.data;
            if (append) {
              setSentInvites((prev) => {
                const ids = new Set(prev.map((f) => f.id));
                return [...prev, ...response.userSummaryResponses.filter((f) => !ids.has(f.id))];
              });
            } else setSentInvites(response.userSummaryResponses);
            break;
        }
        setHasMore(response.hasMore);
      } catch {
        console.error("[Contacts] Failed to fetch data");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    setHasMore(true);
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  useEffect(() => {
    const unsub = SocketManager.on("FRIENDSHIP", (ev: FriendshipEventPayload) => {
      if (ev.userSummaryResponse.id === userSession?.id) return;
      switch (ev.type) {
        case "INVITED":
          setReceivedInvites((p) => p.some((u) => u.id === ev.userSummaryResponse.id) ? p : [ev.userSummaryResponse, ...p]);
          setStats((p) => ({ ...p, totalReceivedInvites: p.totalReceivedInvites + 1 }));
          break;
        case "ACCEPTED":
          setFriends((p) => p.some((u) => u.id === ev.userSummaryResponse.id) ? p : [ev.userSummaryResponse, ...p]);
          setSentInvites((p) => p.filter((u) => u.id !== ev.userSummaryResponse.id));
          setStats((p) => ({ ...p, totalFriends: p.totalFriends + 1, totalSentInvites: Math.max(0, p.totalSentInvites - 1) }));
          break;
        case "REJECTED":
          setSentInvites((p) => p.filter((u) => u.id !== ev.userSummaryResponse.id));
          setStats((p) => ({ ...p, totalSentInvites: Math.max(0, p.totalSentInvites - 1) }));
          break;
        case "CANCELED":
          setReceivedInvites((p) => p.filter((u) => u.id !== ev.userSummaryResponse.id));
          setStats((p) => ({ ...p, totalReceivedInvites: Math.max(0, p.totalReceivedInvites - 1) }));
          break;
        case "DELETED":
          setFriends((p) => p.filter((u) => u.id !== ev.userSummaryResponse.id));
          setStats((p) => ({ ...p, totalFriends: Math.max(0, p.totalFriends - 1) }));
          break;
      }
    });
    return () => unsub();
  }, [userSession?.id]);

  useEffect(() => {
    const unsub = SocketManager.on("USER_STATUS", (s) => {
      setFriends((p) =>
        p.map((f) =>
          f.id === Number(s.userId) ? { ...f, status: s.isOnline ? "ONLINE" : "OFFLINE" } : f
        )
      );
    });
    return () => unsub();
  }, []);

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return;
    const list = activeTab === "friends" ? friends : activeTab === "received" ? receivedInvites : sentInvites;
    if (list.length > 0) fetchData(activeTab, list[list.length - 1].id, true);
  };

  const withProcessing = async (id: number, fn: () => Promise<void>) => {
    try {
      setProcessingIds((p) => new Set(p).add(id));
      await fn();
    } finally {
      setProcessingIds((p) => { const n = new Set(p); n.delete(id); return n; });
    }
  };

  const handleRemoveFriend = (fid: number) =>
    withProcessing(fid, async () => {
      await deleteFriendshipApi(fid);
      setFriends((p) => p.filter((f) => f.friendshipSummary?.id !== fid));
      setStats((p) => ({ ...p, totalFriends: Math.max(0, p.totalFriends - 1) }));
    });

  const handleAccept = (fid: number) =>
    withProcessing(fid, async () => {
      await acceptInvitationApi(fid);
      setReceivedInvites((p) => p.filter((f) => f.friendshipSummary?.id !== fid));
      setStats((p) => ({ ...p, totalFriends: p.totalFriends + 1, totalReceivedInvites: Math.max(0, p.totalReceivedInvites - 1) }));
    });

  const handleReject = (fid: number) =>
    withProcessing(fid, async () => {
      await rejectInvitationApi(fid);
      setReceivedInvites((p) => p.filter((f) => f.friendshipSummary?.id !== fid));
      setStats((p) => ({ ...p, totalReceivedInvites: Math.max(0, p.totalReceivedInvites - 1) }));
    });

  const handleCancel = (fid: number) =>
    withProcessing(fid, async () => {
      await cancelInvitationApi(fid);
      setSentInvites((p) => p.filter((f) => f.friendshipSummary?.id !== fid));
      setStats((p) => ({ ...p, totalSentInvites: Math.max(0, p.totalSentInvites - 1) }));
    });

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await lookupUserByEmailApi(searchEmail.trim());
      setSearchResult(res.data.data);
    } catch {
      Alert.alert("Không tìm thấy", "Không có người dùng với email này");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendInvitation = async (targetUserId: number) => {
    try {
      await sendInvitationApi({ targetUserId });
      Alert.alert("Thành công", "Đã gửi lời mời kết bạn!");
      setStats((p) => ({ ...p, totalSentInvites: p.totalSentInvites + 1 }));
      setSearchResult(null);
      setSearchEmail("");
      setShowAddFriend(false);
      fetchData("sent");
    } catch {
      Alert.alert("Lỗi", "Không thể gửi lời mời");
    }
  };

  const handleStartChat = async (userId: number) => {
    try {
      const res = await createOrGetDirectRoomApi({ targetUserId: userId });
      router.push({
        pathname: "/(app)/messages/[roomId]",
        params: { roomId: res.data.data.roomId.toString() },
      });
    } catch {
      Alert.alert("Lỗi", "Không thể tạo trò chuyện");
    }
  };

  const tabs: { id: TabId; label: string; icon: typeof Users; count: number }[] = [
    { id: "friends", label: "Bạn bè", icon: Users, count: stats.totalFriends },
    { id: "received", label: "Lời mời", icon: Inbox, count: stats.totalReceivedInvites },
    { id: "sent", label: "Đã gửi", icon: Send, count: stats.totalSentInvites },
  ];

  const currentList = activeTab === "friends" ? friends : activeTab === "received" ? receivedInvites : sentInvites;
  const filteredList = currentList.filter((u) =>
    !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const emptyMessages: Record<TabId, string> = {
    friends: "Chưa có bạn bè nào",
    received: "Không có lời mời nào",
    sent: "Chưa gửi lời mời nào",
  };
  
  const iconColor = "#c026d3";

  const renderUserCard = ({ item }: { item: UserSummaryResponse }) => {
    const isProcessing = item.friendshipSummary ? processingIds.has(item.friendshipSummary.id) : false;
    const isOnline = item.status === "ONLINE";

    return (
      <View className="flex-row items-center py-3 px-4 mb-2 mx-4 bg-card rounded-[20px] shadow-sm">
        {/* Avatar */}
        <View className="relative">
          {item.avatarUrl ? (
            <Image
              source={{ uri: item.avatarUrl }}
              className="w-12 h-12 rounded-full border-[1.5px] border-primary/20"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center border border-primary/10">
              <Users size={20} className="text-primary" color={iconColor} />
            </View>
          )}
          {activeTab === "friends" && isOnline && (
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-[2.5px] border-card z-10" />
          )}
        </View>

        {/* Info */}
        <View className="flex-1 ml-3">
          <Text className="font-bold text-[14px] text-foreground" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-[12px] text-muted-foreground mt-0.5" numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row items-center gap-2 ml-2">
          {activeTab === "friends" && (
            <>
              <TouchableOpacity
                onPress={() => handleStartChat(item.id)}
                className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center border border-primary/20"
              >
                <MessageCircle size={15} className="text-primary" color={iconColor} />
              </TouchableOpacity>
              {item.friendshipSummary && (
                <TouchableOpacity
                  onPress={() => handleRemoveFriend(item.friendshipSummary!.id)}
                  disabled={isProcessing}
                  className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20"
                >
                  {isProcessing ? (
                    <ActivityIndicator size={12} color="#EF4444" />
                  ) : (
                    <UserMinus size={14} color="#EF4444" />
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

          {activeTab === "received" && item.friendshipSummary && (
            <>
              <TouchableOpacity
                onPress={() => handleAccept(item.friendshipSummary!.id)}
                disabled={isProcessing}
                className="w-9 h-9 rounded-full bg-green-500/10 border border-green-500/30 items-center justify-center"
              >
                {isProcessing ? <ActivityIndicator size={12} color="#22C55E" /> : <Check size={16} color="#22C55E" />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReject(item.friendshipSummary!.id)}
                disabled={isProcessing}
                className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 items-center justify-center"
              >
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}

          {activeTab === "sent" && (
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <Clock size={11} color="#F59E0B" />
                <Text className="text-[11px] text-amber-500 font-semibold ml-1">
                  Chờ
                </Text>
              </View>
              {item.friendshipSummary && (
                <TouchableOpacity
                  onPress={() => handleCancel(item.friendshipSummary!.id)}
                  disabled={isProcessing}
                  className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20"
                >
                  {isProcessing ? <ActivityIndicator size={12} color="#EF4444" /> : <X size={14} color="#EF4444" />}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-6 pt-5 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/30">
            <Image
              source={{ uri: userSession?.avatarUrl || "https://i.pravatar.cc/150?img=11" }}
              className="w-full h-full"
            />
          </View>
          <View className="ml-3">
            <Text className="text-2xl font-black text-foreground tracking-tight">
              Danh bạ
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {stats.totalFriends} bạn bè
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddFriend(!showAddFriend)}
          className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 items-center justify-center"
        >
          <UserPlus size={20} className="text-primary" color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Add Friend */}
      {showAddFriend && (
        <View className="mx-6 mb-2.5 p-4 rounded-[20px] bg-card shadow-sm">
          <Text className="text-[14px] font-bold text-foreground mb-3">
            Thêm bạn bè
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1 flex-row items-center h-[42px] px-3.5 rounded-[16px] bg-muted/60 border border-border">
              <Search size={16} className="text-muted-foreground" color="#71717A" />
              <TextInput
                className="flex-1 ml-2 text-[13px] text-foreground"
                placeholder="Nhập email..."
                placeholderTextColor="#71717A"
                value={searchEmail}
                onChangeText={setSearchEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={handleSearchUser}
              />
            </View>
            <TouchableOpacity
              onPress={handleSearchUser}
              disabled={isSearching || !searchEmail.trim()}
              className={`h-[42px] px-4.5 rounded-xl items-center justify-center ${
                searchEmail.trim() ? "bg-primary" : "bg-primary/50"
              }`}
            >
              {isSearching ? (
                <ActivityIndicator size={14} color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-bold text-[13px]">Tìm</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {searchResult && (
            <View className="mt-3 flex-row items-center pt-3 border-t border-border">
              {searchResult.avatarUrl ? (
                <Image source={{ uri: searchResult.avatarUrl }} className="w-10 h-10 rounded-full border-[1.5px] border-primary/20" />
              ) : (
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center border border-primary/10">
                  <Users size={16} className="text-primary" color={iconColor} />
                </View>
              )}
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-[14px] text-foreground" numberOfLines={1}>{searchResult.name}</Text>
                <Text className="text-[12px] text-muted-foreground">{searchResult.email}</Text>
              </View>
              {searchResult.friendshipSummary ? (
                <View className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                  <Text className="text-[11px] font-semibold text-primary">
                    {searchResult.friendshipSummary.friendshipStatus === "ACCEPTED" ? "Đã là bạn" : "Đang chờ"}
                  </Text>
                </View>
              ) : searchResult.id !== userSession?.id ? (
                <TouchableOpacity
                  onPress={() => handleSendInvitation(searchResult.id)}
                  className="bg-primary px-4 py-2 rounded-full shadow-sm"
                >
                  <Text className="text-primary-foreground text-[12px] font-bold">Kết bạn</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row mx-6 mb-2.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`flex-1 flex-row items-center justify-center py-2.5 mx-0.5 rounded-xl border ${
                isActive ? "bg-primary/10 border-primary/30" : "bg-card border-transparent"
              }`}
            >
              <Icon size={15} className={isActive ? "text-primary" : "text-muted-foreground"} color={isActive ? iconColor : "#71717A"} />
              <Text
                className={`ml-1.5 text-[12px] font-bold ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View
                  className={`ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full items-center justify-center ${
                    isActive ? "bg-primary" : "bg-primary/10"
                  }`}
                >
                  <Text className={`text-[10px] font-extrabold ${isActive ? "text-primary-foreground" : "text-primary"}`}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search */}
      <View className="px-6 mb-2">
        <View className="flex-row items-center h-[42px] px-3.5 rounded-[16px] bg-muted/60 border border-border">
          <Search size={16} className="text-muted-foreground" color="#71717A" />
          <TextInput
            className="flex-1 ml-2.5 text-[13px] text-foreground"
            placeholder="Tìm kiếm..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={iconColor} />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20, paddingTop: 4 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={iconColor} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-12 px-8">
              <View className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 items-center justify-center mb-3">
                <Users size={26} className="text-primary" color={iconColor} />
              </View>
              <Text className="text-[14px] font-semibold text-foreground mb-1">
                {emptyMessages[activeTab]}
              </Text>
              <Text className="text-[12px] text-muted-foreground text-center">
                Bấm nút thêm để kết bạn mới nhé
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
