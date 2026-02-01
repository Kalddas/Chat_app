import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import echo from "../services/echo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
};

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("disconnected");
  const [messages, setMessages] = useState({}); // { conversationId: [messages] }
  const [typingUsers, setTypingUsers] = useState({}); // { conversationId: [userIds] }
  const [currentChannel, setCurrentChannel] = useState(null);
  const navigate = useNavigate();

  // Handle connection status
  useEffect(() => {
    const connection = echo.connector.pusher.connection;
    connection.bind("connected", () => {
      setIsConnected(true);
      setConnectionState("connected");
    });
    connection.bind("connecting", () => setConnectionState("connecting"));
    connection.bind("disconnected", () => {
      setIsConnected(false);
      setConnectionState("disconnected");
    });

    return () => echo.disconnect();
  }, []);

  // Listen for user notifications
  useEffect(() => {
    if (isConnected && user?.id) {
      const notificationChannel = `App.Models.User.${user.id}`;
      console.log(`Subscribing to notifications on ${notificationChannel}`);

      echo.private(notificationChannel).notification((notification) => {
        console.log("New notification received via WebSocket:", notification);
        // Dispatch a custom event so other components can react
        window.dispatchEvent(new CustomEvent("chat:newNotification", { detail: notification }));
      });

      return () => {
        console.log(`Leaving notification channel ${notificationChannel}`);
        echo.leave(notificationChannel);
      };
    }
  }, [isConnected, user?.id]);

  // Join a conversation channel
  const joinConversation = useCallback((conversationId) => {
    if (!echo || !conversationId) return;

    const channelName = `private-conversation.${conversationId}`;

    if (currentChannel) echo.leave(currentChannel);

    const channel = echo.private(channelName);

    channel.listen(".MessageSent", (e) => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), e.message],
      }));
    });

    channel.listenForWhisper("typing", (e) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: e.userId ? [e.userId] : [],
      }));
    });

    setCurrentChannel(channelName);
  }, [currentChannel]);

  const leaveConversation = useCallback((conversationId) => {
    const channelName = conversationId ? `private-conversation.${conversationId}` : currentChannel;
    if (!channelName) return;

    echo.leave(channelName);
    setTypingUsers((prev) => ({ ...prev, [conversationId]: [] }));
    if (channelName === currentChannel) setCurrentChannel(null);
  }, [currentChannel]);

  const sendMessage = useCallback((conversationId, messageText) => {
    if (!echo) return false;
    try {
      echo.private(`private-conversation.${conversationId}`)
        .whisper("message", { message: messageText });
      return true;
    } catch (err) {
      console.error("WebSocket send failed", err);
      return false;
    }
  }, []);

  const sendTyping = useCallback((conversationId, userId) => {
    if (!echo) return;
    echo.private(`private-conversation.${conversationId}`).whisper("typing", { userId });
  }, []);

  const getMessagesForConversation = (conversationId) => messages[conversationId] || [];
  const getTypingUsersForConversation = (conversationId) => typingUsers[conversationId] || [];

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      connectionState,
      joinConversation,
      leaveConversation,
      sendMessage,
      sendTyping,
      getMessagesForConversation,
      getTypingUsersForConversation
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
