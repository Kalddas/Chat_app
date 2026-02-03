import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:8000/api",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Send a chat request
    sendChatRequest: builder.mutation({
      query: (body) => ({ url: "chat/requests", method: "POST", body }),
      invalidatesTags: ["Chat"],

    }),
    getReceivedRequests: builder.query({
      query: () => "chat/requests/received",
      providesTags: ["Chat"],

    }),
    acceptRequest: builder.mutation({
      query: ({ requestId, userId }) => ({
        url: `chat/requests/${requestId}/accept`,
        method: "POST",
        body: { user_id: userId },
      }),
      invalidatesTags: ["Chat"],

    }),
    rejectRequest: builder.mutation({
      query: ({ requestId }) => ({
        url: `chat/requests/${requestId}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["Chat"],

    }),
    blockUser: builder.mutation({
      query: ({ userId }) => ({
        url: "chat/block",
        method: "POST",
        body: { user_id: userId },
      }),
      invalidatesTags: ["Chat"],
    }),
    unblockUser: builder.mutation({
      query: ({ userId }) => ({
        url: "chat/unblock",
        method: "POST",
        body: { user_id: userId },
      }),
      invalidatesTags: ["Chat"],
    }),
    sendMessage: builder.mutation({
      query: ({ conversationId, receiver_id, text, files, reply_to_id }) => {
        // If files are provided, send multipart/form-data
        if (files && files.length) {
          const formData = new FormData();
          if (text && text.trim()) {
            formData.append("text", text);
          }
          formData.append("receiver_id", receiver_id);
          if (reply_to_id) {
            formData.append("reply_to_id", reply_to_id);
          }
          files.forEach((file) => {
            formData.append("attachments[]", file);
          });

          return {
            url: `chat/conversations/${conversationId}/messages/send`,
            method: "POST",
            body: formData,
          };
        }

        // Fallback: simple JSON body for text-only messages
        return {
          url: `chat/conversations/${conversationId}/messages/send`,
          method: "POST",
          body: { text, receiver_id, reply_to_id },
        };
      },
      invalidatesTags: ["Chat"],
    }),

    getMessages: builder.query({
      query: ({ conversationId, userId }) =>
        `chat/conversations/${conversationId}/messages?user_id=${userId}`,
      providesTags: ["Chat"],

    }),


    //https://liveflow-v99z.onrender.com/api/chat/conversations/1/messages
    editMessage: builder.mutation({
      query: ({ messageId, text, receiver_id }) => ({
        url: `chat/messages/${messageId}/edit`,
        method: "PUT",
        body: { text, receiver_id },

      }),
      invalidatesTags: ["Chat"],

    }),
    deleteMessage: builder.mutation({
      query: ({ messageId, userId }) => ({
        url: `chat/messages/${messageId}/delete`,
        method: "DELETE",
        body: { user_id: userId },
      }),
      invalidatesTags: ["Chat"],

    }),
    getChats: builder.query({
      query: (userId) => `chat/chat-list?user_id=${userId}`,
      providesTags: ["Chat"],

    }),
    getAllConversations: builder.query({
      query: ({ userId }) => `chat/users/${userId}/conversations`,
      providesTags: ["Chat"],

    }),
    deleteConversation: builder.mutation({
      query: ({ conversationId }) => ({
        url: `chat/conversations/${conversationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chat"],
    }),
    markAsRead: builder.mutation({
      query: (conversationId) => ({
        url: `chat/conversations/${conversationId}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Chat"],
    }),
    addReaction: builder.mutation({
      query: ({ messageId, emoji }) => ({
        url: `chat/messages/${messageId}/reactions`,
        method: "POST",
        body: { emoji },
      }),
      invalidatesTags: ["Chat"],
    }),
  }),
});

export const {
  useSendChatRequestMutation,
  useGetReceivedRequestsQuery,
  useGetChatsQuery,
  useAcceptRequestMutation,
  useRejectRequestMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useSendMessageMutation,
  useGetMessagesQuery,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useGetAllConversationsQuery,
  useDeleteConversationMutation,
  useMarkAsReadMutation,
  useAddReactionMutation,
} = chatApi;
