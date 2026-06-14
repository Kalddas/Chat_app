import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getEcho, disconnectEcho } from "../services/echo";
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
  const [messages, setMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [currentChannel, setCurrentChannel] = useState(null);

  // Only connect WebSocket when user is logged in (Soketi optional)
  useEffect(() => {
    if (!user?.id) {
      disconnectEcho();
      setIsConnected(false);
      setConnectionState("disconnected");
      return;
    }

    const echo = getEcho();
    if (!echo) return;

    const connection = echo.connector.pusher.connection;

    const onConnected = () => {
      setIsConnected(true);
      setConnectionState("connected");
    };
    const onConnecting = () => setConnectionState("connecting");
    const onDisconnected = () => {
      setIsConnected(false);
      setConnectionState("disconnected");
    };

    connection.bind("connected", onConnected);
    connection.bind("connecting", onConnecting);
    connection.bind("disconnected", onDisconnected);

    if (connection.state === "connected") onConnected();

    return () => {
      connection.unbind("connected", onConnected);
      connection.unbind("connecting", onConnecting);
      connection.unbind("disconnected", onDisconnected);
      disconnectEcho();
    };
  }, [user?.id]);

  useEffect(() => {
    const echo = getEcho();
    if (!isConnected || !user?.id || !echo) return;

    const notificationChannel = `App.Models.User.${user.id}`;

    echo.private(notificationChannel).notification((notification) => {
      window.dispatchEvent(new CustomEvent("chat:newNotification", { detail: notification }));
    });

    return () => {
      echo.leave(notificationChannel);
    };
  }, [isConnected, user?.id]);

  const joinConversation = useCallback((conversationId) => {
    const echo = getEcho();
    if (!echo || !conversationId) return;

    const channelName = `chat.${conversationId}`;

    if (currentChannel) echo.leave(currentChannel);

    const channel = echo.private(channelName);

    channel.listen(".message.sent", (payload) => {
      window.dispatchEvent(new CustomEvent("chat:newMessage", {
        detail: {
          conversation_id: payload.conversation_id ?? conversationId,
          message_id: payload.message_id,
          has_attachments: payload.has_attachments,
        },
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
    const echo = getEcho();
    const channelName = conversationId ? `chat.${conversationId}` : currentChannel;
    if (!echo || !channelName) return;

    echo.leave(channelName);
    setTypingUsers((prev) => ({ ...prev, [conversationId]: [] }));
    if (channelName === currentChannel) setCurrentChannel(null);
  }, [currentChannel]);

  const sendMessage = useCallback((conversationId, messageText) => {
    const echo = getEcho();
    if (!echo) return false;
    try {
      echo.private(`chat.${conversationId}`).whisper("message", { message: messageText });
      return true;
    } catch (err) {
      console.error("WebSocket send failed", err);
      return false;
    }
  }, []);

  const sendTyping = useCallback((conversationId, userId) => {
    const echo = getEcho();
    if (!echo) return;
    echo.private(`chat.${conversationId}`).whisper("typing", { userId });
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
