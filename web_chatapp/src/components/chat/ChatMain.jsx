// File: src/components/chat/ChatMain.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Smile, Flag, MoreVertical, Paperclip, Mic, Square, X, Video } from "lucide-react";
import { useGetMessagesQuery, useSendMessageMutation, useAddReactionMutation } from "../../services/chatService";
import { useSubmitReportMutation } from "../../services/reportService";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { toast } from "react-toastify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ChatMain({ selectedChat, selectedChatInfo, onContactInfoClick }) {
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUserId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const {
    messages: wsMessages,
    connectionState,
    isConnected,
    joinConversation,
    leaveConversation,
  } = useWebSocket();

  const { data: apiMessages, isLoading, isError } = useGetMessagesQuery(
    { conversationId: selectedChat },
    { skip: !selectedChat }
  );

  const [sendMessage] = useSendMessageMutation();
  const [submitReport] = useSubmitReportMutation();

  // Get current user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUserId(user);
    }
  }, []);

  // Normalize messages
  const normalizeMessage = useCallback((msg) => {
    // Group reactions by emoji type for display
    const reactionsGrouped = {};
    if (msg.reactions && Array.isArray(msg.reactions)) {
      msg.reactions.forEach(r => {
        reactionsGrouped[r.emoji] = (reactionsGrouped[r.emoji] || 0) + 1;
      });
    }

    return {
      id: msg.id,
      clientId: msg.clientId || `temp-${Date.now()}-${Math.random()}`,
      message: msg.message || msg.text || "",
      timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
      sender: msg.sender || { id: null, name: "Unknown" },
      temp: msg.temp || false,
      edited: msg.edited || false,
      deleted: msg.deleted || false,
      reactions: reactionsGrouped,
      attachments: msg.attachments || [],
      audioUrl: msg.audioUrl,
    };
  }, []);

  // Merge API + WS + current messages
  useEffect(() => {
    if (!selectedChat) return;

    const rawApi = Array.isArray(apiMessages) ? apiMessages : (apiMessages?.messages || []);
    const apiMsgs = rawApi.map(normalizeMessage);
    const wsMsgs = (wsMessages || [])
      .filter((msg) => msg.conversation_id === selectedChat)
      .map(normalizeMessage);

    const merged = new Map();
    allMessages.forEach((m) => merged.set(m.id ?? m.clientId, m));
    [...apiMsgs, ...wsMsgs].forEach((m) =>
      merged.set(m.id ?? m.clientId, { ...(merged.get(m.id ?? m.clientId) || {}), ...m })
    );

    setAllMessages(Array.from(merged.values()).sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiMessages, wsMessages, selectedChat]);

  // Join/leave conversation
  useEffect(() => {
    if (selectedChat && isConnected) joinConversation(selectedChat);
    return () => {
      if (selectedChat) leaveConversation(selectedChat);
    };
  }, [selectedChat, isConnected, joinConversation, leaveConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Listen for call attempts from the contact info panel and log them as system messages
  useEffect(() => {
    const handler = (e) => {
      const { conversationId, type, timestamp } = e.detail || {};
      if (!conversationId || conversationId !== selectedChat) return;

      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const systemText =
        type === "video"
          ? "You attempted a video call."
          : "You attempted a voice call.";

      const systemMessage = {
        clientId: `system-call-${timestamp}`,
        message: systemText,
        timestamp: timestamp || new Date().toISOString(),
        sender: { id: user?.id ?? null, name: "System" },
        conversation_id: conversationId,
        temp: false,
      };

      setAllMessages((prev) => [...prev, systemMessage]);
    };

    window.addEventListener("chat:callAttempt", handler);
    return () => window.removeEventListener("chat:callAttempt", handler);
  }, [selectedChat]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachedFiles.length === 0) || !selectedChat || !currentUser) return;

    const clientId = `temp-${Date.now()}-${Math.random()}`;
    const tempMsg = {
      clientId,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      sender: { id: currentUser?.id, name: "You" },
      conversation_id: selectedChat,
      temp: true,
      attachments: attachedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    };

    // Show temp message
    setAllMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");
    setAttachedFiles([]);

    try {
      const response = await sendMessage({
        conversationId: selectedChat,
        text: tempMsg.message,
        receiver_id: selectedChatInfo?.userId,
        files: attachedFiles,
      }).unwrap();

      // Replace temp message with server-confirmed message
      setAllMessages((prev) =>
        prev.map((msg) =>
          msg.clientId === clientId ? normalizeMessage(response?.data ?? response) : msg
        )
      );

      // Optional: send via Echo for live update
      if (isConnected && window.Echo) {
        window.Echo.private(`conversation.${selectedChat}`).whisper("message.sent", {
          ...tempMsg,
          id: response.id ?? clientId,
        });
      }
    } catch (err) {
      console.error("Send message error:", err);
      setAllMessages((prev) =>
        prev.map((msg) =>
          msg.clientId === clientId ? { ...msg, failed: true } : msg
        )
      );
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const [addReaction] = useAddReactionMutation();

  // Emoji reactions
  const addEmojiReaction = async (messageId, emoji) => {
    if (!messageId) return;

    // Optimistic UI update
    setAllMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const newReactions = { ...msg.reactions };
        newReactions[emoji] = (newReactions[emoji] || 0) + 1;
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));

    try {
      await addReaction({ messageId, emoji }).unwrap();
    } catch (err) {
      console.error("Failed to add reaction:", err);
      toast.error("Failed to save reaction");
      // Rollback optimistic update on error
      setAllMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const newReactions = { ...msg.reactions };
          if (newReactions[emoji] > 0) {
            newReactions[emoji] -= 1;
            if (newReactions[emoji] === 0) delete newReactions[emoji];
          }
          return { ...msg, reactions: newReactions };
        }
        return msg;
      }));
    }
  };

  // Report functionality
  const handleReportChat = () => {
    setShowReportDialog(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason || !reportDescription) return;

    setIsSubmittingReport(true);
    try {
      // First test if API is accessible
      console.log('Testing API accessibility...');
      const testResponse = await fetch('http://127.0.0.1:8000/api/test-reports', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        throw new Error(`API test failed: ${testResponse.status} ${testResponse.statusText}`);
      }

      const testData = await testResponse.json();
      console.log('API test successful:', testData);

      const reportData = new FormData();
      reportData.append('title', `Report: ${reportReason}`);
      reportData.append('message', `Reason: ${reportReason}\n\nDescription: ${reportDescription}`);
      if (selectedChatInfo?.userId) {
        reportData.append('reported_user_id', selectedChatInfo.userId.toString());
      }
      if (selectedChat) {
        reportData.append('conversation_id', selectedChat.toString());
      }

      console.log('Submitting report with data:', {
        title: `Report: ${reportReason}`,
        message: `Reason: ${reportReason}\n\nDescription: ${reportDescription}`,
        reported_user_id: selectedChatInfo?.userId,
        conversation_id: selectedChat
      });

      try {
        await submitReport(reportData).unwrap();
      } catch (rtkError) {
        console.log('RTK Query failed, trying direct fetch...', rtkError);

        // Fallback: Direct fetch approach
        const directResponse = await fetch('http://127.0.0.1:8000/api/reports', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          },
          body: reportData
        });

        if (!directResponse.ok) {
          const errorData = await directResponse.json();
          throw new Error(`Direct fetch failed: ${directResponse.status} - ${JSON.stringify(errorData)}`);
        }

        const result = await directResponse.json();
        console.log('Direct fetch successful:', result);
      }

      setShowReportDialog(false);
      setReportReason("");
      setReportDescription("");
      // Show success message
      toast.success('Report submitted successfully!');
    } catch (error) {
      console.error('Failed to submit report:', error);
      const errorMessage = error?.data?.error || error?.data?.message || error?.message || 'Failed to submit report. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const emojiOptions = ['😀', '😂', '❤️', '👍', '👎', '😢', '😡', '🎉'];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      // Filter to only allow images and videos
      const allowedFiles = files.filter(file => {
        const type = file.type.toLowerCase();
        return type.startsWith('image/') || type.startsWith('video/');
      });

      if (allowedFiles.length !== files.length) {
        toast.warning('Only images and videos are allowed. Other file types were ignored.');
      }

      if (allowedFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...allowedFiles]);
      }
    }
    // Reset input so same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(blob);

        const audioMessage = {
          clientId: `audio-${Date.now()}`,
          message: "Voice message",
          timestamp: new Date().toISOString(),
          sender: { id: currentUser?.id, name: "You" },
          conversation_id: selectedChat,
          temp: false,
          audioUrl,
        };

        setAllMessages((prev) => [...prev, audioMessage]);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start audio recording:", err);
      toast.error("Could not access your microphone. Please check permissions.");
    }
  };

  if (!selectedChat)
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#E4E9FC] to-[#FFFFFF] dark:bg-background">
        <div className="text-center">
          <div className="w-24 h-24 bg-indigo-100 dark:bg-card rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-12 w-12 text-indigo-600 dark:text-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-indigo-900 dark:text-foreground mb-2">
            Welcome to Live Flow
          </h3>
          <p className="text-indigo-700 dark:text-muted-foreground max-w-md">
            Select a chat from the sidebar to start messaging.
          </p>
        </div>
      </div>
    );

  if (isLoading)
    return <div className="p-4 text-center text-indigo-600 dark:text-muted-foreground">Loading messages...</div>;
  if (isError)
    return <div className="p-4 text-center text-red-500 dark:text-red-400">Failed to load messages</div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-[#E4E9FC] to-[#FFFFFF] dark:bg-background">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-border bg-white dark:bg-card flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onContactInfoClick}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedChatInfo?.avatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-indigo-100 dark:bg-card text-indigo-700 dark:text-foreground">
              {selectedChatInfo?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-indigo-900 dark:text-foreground">{selectedChatInfo?.name}</h3>
            <p className={`text-sm ${connectionState === "connected" ? "text-green-500" : "text-red-500"}`}>
              {connectionState === "connected" ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent dark:bg-background">
        {allMessages.map((msg, index) => {
          const isOwn = msg.sender?.id === currentUser?.id;
          return (
            <div
              key={msg.id ?? msg.clientId ?? index} // unique key
              className={`flex mb-4 ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-end max-w-xs lg:max-w-md ${isOwn ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 mx-2">
                  <AvatarImage src={isOwn ? currentUser?.profile_picture_url : selectedChatInfo?.avatar} />
                  <AvatarFallback className="bg-indigo-100 dark:bg-card text-indigo-700 dark:text-foreground">
                    {isOwn ? (currentUser?.name?.charAt(0) || "Y") : (selectedChatInfo?.name?.charAt(0) || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isOwn ? "items-end mr-2" : "items-start ml-2"}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl break-words ${isOwn
                      ? "bg-[#7F56DA] dark:bg-[#7F56DA] text-white rounded-br-none"
                      : "bg-gradient-to-br from-[#F5F5F7] to-[#EBEBF2] dark:bg-card text-gray-700 dark:text-foreground rounded-bl-none shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-[#E8E8EE]/80"
                      } ${msg.temp ? "opacity-70 italic" : ""}`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    {/* Attachments display */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((att, idx) => {
                          const isImage = att.type?.startsWith('image/') || att.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                          const isVideo = att.type?.startsWith('video/') || att.url?.match(/\.(mp4|webm|ogg)$/i);

                          return (
                            <div
                              key={`${msg.id ?? msg.clientId}-att-${idx}`}
                              className="rounded overflow-hidden"
                            >
                              {isImage && att.url && (
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                                  <img
                                    src={att.url}
                                    alt={att.name || 'Attachment'}
                                    className="max-w-full max-h-64 rounded object-contain"
                                  />
                                </a>
                              )}
                              {isVideo && att.url && (
                                <video
                                  src={att.url}
                                  controls
                                  className="max-w-full max-h-64 rounded"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              )}
                              {!isImage && !isVideo && (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-xs opacity-90 hover:underline"
                                >
                                  <Paperclip className="h-3 w-3 mr-1" />
                                  <span>{att.name || 'Download file'}</span>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Audio message */}
                    {msg.audioUrl && (
                      <div className="mt-2">
                        <audio controls src={msg.audioUrl} className="w-40" />
                      </div>
                    )}
                  </div>

                  {/* Emoji Reactions */}
                  {/* Persisted Emoji Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {Object.entries(msg.reactions).map(([emoji, count]) => (
                        <span key={emoji} className="text-xs bg-gray-200 dark:bg-card px-2 py-1 rounded-full dark:text-foreground">
                          {Array(count).fill(emoji).join('')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Actions */}
                  <div className="flex items-center gap-2 mt-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground">
                          <Smile className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-card dark:bg-card border border-gray-200 dark:border-border">
                        <div className="grid grid-cols-4 gap-1 p-2">
                          {emojiOptions.map((emoji) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-accent"
                              onClick={() => addEmojiReaction(msg.id, emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {!isOwn && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-500 dark:text-muted-foreground hover:text-red-500 dark:hover:text-red-400">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-card dark:bg-card border border-gray-200 dark:border-border">
                          <DropdownMenuItem
                            onClick={handleReportChat}
                            className="text-red-600 dark:text-red-400 focus:bg-red-100 dark:focus:bg-red-900 focus:text-red-900 dark:focus:text-red-100"
                          >
                            <Flag className="mr-2 h-4 w-4" />
                            Report Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-[#E4E9FC]/60 dark:border-border bg-[#E4E9FC] dark:bg-card">
          <div className="flex flex-wrap gap-2 items-center">
            {attachedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 bg-gray-100 dark:bg-muted px-2 py-1 rounded border border-gray-200 dark:border-border"
              >
                {file.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                )}
                {file.type.startsWith('video/') && (
                  <div className="h-10 w-10 bg-muted dark:bg-muted rounded flex items-center justify-center">
                    <Video className="h-5 w-5 text-indigo-600 dark:text-foreground" />
                  </div>
                )}
                <span className="text-xs text-indigo-900 dark:text-foreground max-w-[100px] truncate">
                  {file.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-5 w-5 p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 flex gap-2 items-center border-t border-[#E4E9FC]/60 dark:border-border bg-[#E4E9FC] dark:bg-card">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-[#7C84C8] dark:text-[#8A92D4] hover:bg-[#D0D4F0] dark:hover:bg-[#8A92D4]/20 rounded-full h-9 w-9 p-0"
        >
          <Smile className="h-4 w-4" />
        </Button>

        {/* File uploader */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFileButtonClick}
          className="text-[#7C84C8] dark:text-[#8A92D4] hover:bg-[#D0D4F0] dark:hover:bg-[#8A92D4]/20 rounded-full h-9 w-9 p-0"
          title="Attach files (images & videos)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Voice recorder */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleRecording}
          className={`rounded-full h-9 w-9 p-0 ${isRecording ? "text-red-600" : "text-[#7C84C8] dark:text-[#8A92D4]"
            } hover:bg-[#D0D4F0] dark:hover:bg-[#8A92D4]/20`}
        >
          {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="rounded-full border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] focus-visible:ring-2 focus-visible:ring-[#8A92D4]/35 dark:focus-visible:ring-[#8A92D4]/40 flex-1 bg-white dark:bg-input text-gray-900 dark:text-foreground placeholder:text-[#A0A8C8] dark:placeholder:text-muted-foreground h-10 px-4"
        />

        <Button
          type="submit"
          disabled={!newMessage.trim() && attachedFiles.length === 0}
          className="rounded-full h-10 w-10 p-0 bg-[#8A92D4] dark:bg-[#8A92D4] text-white hover:bg-[#7C84C8] dark:hover:bg-[#7C84C8]"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md bg-card dark:bg-card border-indigo-200 dark:border-border">
          <DialogHeader>
            <DialogTitle className="text-indigo-900 dark:text-foreground">
              Report @{selectedChatInfo?.name || 'User'}
            </DialogTitle>
            <DialogDescription className="text-indigo-700 dark:text-muted-foreground">
              Please select the reason that best describes your problem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-indigo-900 dark:text-foreground font-semibold">
                REASON
              </Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="border-indigo-300 dark:border-border bg-muted dark:bg-input text-gray-900 dark:text-foreground">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent className="bg-card dark:bg-card border-indigo-200 dark:border-border">
                  <SelectItem value="inappropriate-content" className="text-gray-900 dark:text-foreground">Inappropriate Content</SelectItem>
                  <SelectItem value="harassment" className="text-gray-900 dark:text-foreground">Harassment</SelectItem>
                  <SelectItem value="spam" className="text-gray-900 dark:text-foreground">Spam</SelectItem>
                  <SelectItem value="fake-profile" className="text-gray-900 dark:text-foreground">Fake Profile</SelectItem>
                  <SelectItem value="other" className="text-gray-900 dark:text-foreground">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-indigo-900 dark:text-foreground font-semibold">
                DESCRIPTION
              </Label>
              <Textarea
                id="description"
                placeholder="Tell us more about the issue"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="border-indigo-300 dark:border-border bg-muted dark:bg-input text-gray-900 dark:text-foreground placeholder:text-gray-500 dark:placeholder:text-muted-foreground"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
              className="border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={!reportReason || !reportDescription || isSubmittingReport}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmittingReport ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
