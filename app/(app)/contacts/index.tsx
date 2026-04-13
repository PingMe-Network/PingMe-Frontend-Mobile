import { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppSelector } from "@/features/store";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { SocketManager } from "@/features/chat";
import {
  ContactsHeader,
  AddFriendPanel,
  ContactsTabs,
  UserCard,
  EmptyState,
  type TabId,
} from "@/components/contacts";
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
import type { UserSummaryResponse, UserStatus } from "@/types/common/userSummary";
import type {
  UserFriendshipStatsResponse,
  FriendshipEventPayload,
} from "@/types/friendship";

const mergeUniqueUsersById = (
  prev: UserSummaryResponse[],
  next: UserSummaryResponse[]
) => {
  const ids = new Set(prev.map((f) => f.id));
  return [...prev, ...next.filter((f) => !ids.has(f.id))];
};

const prependUniqueUserById = (
  prev: UserSummaryResponse[],
  user: UserSummaryResponse
) => {
  const exists = prev.some((u) => u.id === user.id);
  if (exists) return prev;
  return [user, ...prev];
};

const removeUserById = (prev: UserSummaryResponse[], userId: number) =>
  prev.filter((u) => u.id !== userId);

const removeUserByFriendshipId = (
  prev: UserSummaryResponse[],
  friendshipId: number
) => prev.filter((u) => u.friendshipSummary?.id !== friendshipId);

const patchUserOnlineStatus = (
  prev: UserSummaryResponse[],
  userId: number,
  isOnline: boolean
) => {
  const nextStatus: UserStatus = isOnline ? "ONLINE" : "OFFLINE";
  return prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u));
};

const dec = (value: number) => Math.max(0, value - 1);

const getListByTab = (
  tab: TabId,
  friends: UserSummaryResponse[],
  receivedInvites: UserSummaryResponse[],
  sentInvites: UserSummaryResponse[]
) => {
  if (tab === "friends") return friends;
  if (tab === "received") return receivedInvites;
  return sentInvites;
};

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

  const fetchData = useCallback(async (tab: TabId, beforeId?: number, append = false) => {
    const tabConfig = {
      friends: {
        fetcher: getAcceptedFriendshipHistoryListApi,
        setList: setFriends,
      },
      received: {
        fetcher: getReceivedHistoryInvitationsApi,
        setList: setReceivedInvites,
      },
      sent: {
        fetcher: getSentHistoryInvitationsApi,
        setList: setSentInvites,
      },
    } as const;

    try {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);

      const config = tabConfig[tab];
      const response = (await config.fetcher(beforeId, 20)).data.data;

      if (append) {
        config.setList((prev) => mergeUniqueUsersById(prev, response.userSummaryResponses));
      } else {
        config.setList(response.userSummaryResponses);
      }

      setHasMore(response.hasMore);
    } catch {
      console.error("[Contacts] Failed to fetch data");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setHasMore(true);
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  useEffect(() => {
    const unsub = SocketManager.on("FRIENDSHIP", (ev: FriendshipEventPayload) => {
      const targetUser = ev.userSummaryResponse;
      if (targetUser.id === userSession?.id) return;

      switch (ev.type) {
        case "INVITED":
          setReceivedInvites((p) => prependUniqueUserById(p, targetUser));
          setStats((p) => ({ ...p, totalReceivedInvites: p.totalReceivedInvites + 1 }));
          break;
        case "ACCEPTED":
          setFriends((p) => prependUniqueUserById(p, targetUser));
          setSentInvites((p) => removeUserById(p, targetUser.id));
          setStats((p) => ({ ...p, totalFriends: p.totalFriends + 1, totalSentInvites: dec(p.totalSentInvites) }));
          break;
        case "REJECTED":
          setSentInvites((p) => removeUserById(p, targetUser.id));
          setStats((p) => ({ ...p, totalSentInvites: dec(p.totalSentInvites) }));
          break;
        case "CANCELED":
          setReceivedInvites((p) => removeUserById(p, targetUser.id));
          setStats((p) => ({ ...p, totalReceivedInvites: dec(p.totalReceivedInvites) }));
          break;
        case "DELETED":
          setFriends((p) => removeUserById(p, targetUser.id));
          setStats((p) => ({ ...p, totalFriends: dec(p.totalFriends) }));
          break;
      }
    });
    return () => unsub();
  }, [userSession?.id]);

  useEffect(() => {
    const unsub = SocketManager.on("USER_STATUS", (s) => {
      setFriends((p) => patchUserOnlineStatus(p, Number(s.userId), s.isOnline));
    });
    return () => unsub();
  }, []);

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return;
    const list = getListByTab(activeTab, friends, receivedInvites, sentInvites);
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
      setFriends((p) => removeUserByFriendshipId(p, fid));
      setStats((p) => ({ ...p, totalFriends: dec(p.totalFriends) }));
    });

  const handleAccept = (fid: number) =>
    withProcessing(fid, async () => {
      await acceptInvitationApi(fid);
      setReceivedInvites((p) => removeUserByFriendshipId(p, fid));
      setStats((p) => ({ ...p, totalFriends: p.totalFriends + 1, totalReceivedInvites: dec(p.totalReceivedInvites) }));
    });

  const handleReject = (fid: number) =>
    withProcessing(fid, async () => {
      await rejectInvitationApi(fid);
      setReceivedInvites((p) => removeUserByFriendshipId(p, fid));
      setStats((p) => ({ ...p, totalReceivedInvites: dec(p.totalReceivedInvites) }));
    });

  const handleCancel = (fid: number) =>
    withProcessing(fid, async () => {
      await cancelInvitationApi(fid);
      setSentInvites((p) => removeUserByFriendshipId(p, fid));
      setStats((p) => ({ ...p, totalSentInvites: dec(p.totalSentInvites) }));
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

  const currentList = getListByTab(activeTab, friends, receivedInvites, sentInvites);
  const filteredList = currentList.filter((u) =>
    !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const emptyMessages: Record<TabId, string> = {
    friends: "Chưa có bạn bè nào",
    received: "Không có lời mời nào",
    sent: "Chưa gửi lời mời nào",
  };
  
  const iconColor = "#c026d3";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ContactsHeader
        avatarUrl={userSession?.avatarUrl}
        totalFriends={stats.totalFriends}
        onToggleAddFriend={() => setShowAddFriend((p) => !p)}
        iconColor={iconColor}
      />

      <AddFriendPanel
        visible={showAddFriend}
        searchEmail={searchEmail}
        setSearchEmail={setSearchEmail}
        isSearching={isSearching}
        searchResult={searchResult}
        currentUserId={userSession?.id}
        onSearch={handleSearchUser}
        onSendInvitation={handleSendInvitation}
        iconColor={iconColor}
      />

      <ContactsTabs
        activeTab={activeTab}
        stats={stats}
        onChangeTab={setActiveTab}
        iconColor={iconColor}
      />

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
          renderItem={({ item }) => (
            <UserCard
              item={item}
              activeTab={activeTab}
              iconColor={iconColor}
              isProcessing={
                item.friendshipSummary
                  ? processingIds.has(item.friendshipSummary.id)
                  : false
              }
              onStartChat={handleStartChat}
              onRemoveFriend={handleRemoveFriend}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
            />
          )}
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
            <EmptyState message={emptyMessages[activeTab]} iconColor={iconColor} />
          }
        />
      )}
    </SafeAreaView>
  );
}
