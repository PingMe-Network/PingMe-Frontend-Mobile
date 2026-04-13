import { View, Text, TouchableOpacity } from "react-native";
import { Users, Inbox, Send } from "lucide-react-native";
import type { UserFriendshipStatsResponse } from "@/types/friendship";
import type { TabId } from "./types";

type ContactsTabsProps = {
  activeTab: TabId;
  stats: UserFriendshipStatsResponse;
  onChangeTab: (tab: TabId) => void;
  iconColor: string;
};

export function ContactsTabs({
  activeTab,
  stats,
  onChangeTab,
  iconColor,
}: Readonly<ContactsTabsProps>) {
  const tabs = [
    { id: "friends" as const, label: "Bạn bè", icon: Users, count: stats.totalFriends },
    { id: "received" as const, label: "Lời mời", icon: Inbox, count: stats.totalReceivedInvites },
    { id: "sent" as const, label: "Đã gửi", icon: Send, count: stats.totalSentInvites },
  ];

  return (
    <View className="flex-row mx-6 mb-2.5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChangeTab(tab.id)}
            className={`flex-1 flex-row items-center justify-center py-2.5 mx-0.5 rounded-xl border ${
              isActive ? "bg-primary/10 border-primary/30" : "bg-card border-transparent"
            }`}
          >
            <Icon
              size={15}
              className={isActive ? "text-primary" : "text-muted-foreground"}
              color={isActive ? iconColor : "#71717A"}
            />
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
                <Text
                  className={`text-[10px] font-extrabold ${
                    isActive ? "text-primary-foreground" : "text-primary"
                  }`}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
