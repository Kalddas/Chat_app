import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGetAllConversationsQuery } from "../../../services/chatService";
import { useWebSocket } from "../../../contexts/WebSocketContext";
import { useChatsContext } from "../../../contexts/ChatsContext";

export function ChatsView({ searchQuery, selectedChat, onChatSelect }) {
  const { onlineUsers, connectionState } = useWebSocket();
  const localUser = localStorage.getItem("user");
  const parsedUser = localUser ? JSON.parse(localUser) : null;
  const userId = parsedUser?.id;

  const { refreshTrigger } = useChatsContext();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllConversationsQuery(
    { userId },
    {
      pollingInterval: 30000,
      skip: !userId, // Avoid calling API with undefined user
    }
  );

  useEffect(() => {
    if (connectionState === "connected" && userId) {
      refetch();
    }
  }, [connectionState, userId, refetch]);

  useEffect(() => {
    if (userId) {
      refetch();
    }
  }, [refreshTrigger, userId, refetch]);

  const chats = data?.conversations?.map(chat => {
    const otherUser = chat.user;
    return {
      id: chat.conversation_id,
      name: `${otherUser?.first_name ?? ''} ${otherUser?.last_name ?? ''}`.trim() || (otherUser?.user_name ?? 'Unknown'),
      username: otherUser?.user_name ?? '',
      avatar: otherUser?.profile_picture_url || "/placeholder.svg",
      lastMessage: chat.last_message ? (chat.last_message.message || "") : "No messages yet",
      timestamp: chat.last_message?.sent_at || chat.last_message_time,
      unreadCount: chat.unread_count || 0,
      isOnline: onlineUsers?.has(otherUser?.id),
      userId: otherUser?.id,
    };
  }) || [];

  const filteredChats = searchQuery
    ? chats.filter(chat =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : chats;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    if (diffInHours < 24) return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffInHours < 168) return messageTime.toLocaleDateString([], { weekday: 'short' });
    return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="overflow-y-auto h-full">
      {isLoading ? (
        <div className="p-4 text-center text-indigo-600 dark:text-muted-foreground">Loading chats...</div>
      ) : isError ? (
        <div className="p-4 text-center text-red-500 dark:text-red-400">Failed to load chats</div>
      ) : filteredChats.length === 0 ? (
        <div className="p-4 text-center text-indigo-600 dark:text-muted-foreground">No chats found</div>
      ) : (
        <div className="divide-y divide-indigo-200 dark:divide-border">
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat.id, chat)}
              className={cn(
                "p-4 hover:bg-indigo-50 dark:hover:bg-accent cursor-pointer transition-colors",
                selectedChat === chat.id && "bg-indigo-100 dark:bg-accent"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={chat.avatar} alt={chat.name} />
                    <AvatarFallback className="bg-indigo-100 dark:bg-card text-indigo-700 dark:text-foreground">{chat.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {chat.isOnline && connectionState === "connected" && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-background"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-indigo-900 dark:text-foreground truncate">{chat.name}</h4>
                    <span className="text-xs text-indigo-600 dark:text-muted-foreground">{formatTimestamp(chat.timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-indigo-700 dark:text-muted-foreground truncate">{chat.lastMessage}</p>
                    {chat.unreadCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-white">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
