import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:8000/api", // Direct URL to Laravel backend
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },

  }),
  endpoints: (builder) => ({
    getUserProfile: builder.query({
      query: () => "user/profile",
      providesTags: ['profile'],
      transformResponse: (response) => {
        // Add a timestamp to help with cache-busting when the data actually changes
        return {
          ...response,
          timestamp: Date.now()
        };
      },
    }),

    updateMood: builder.mutation({
      query: ({ mood }) => ({
        url: "user/mood",
        method: "POST",
        body: { mood },
      }),
      invalidatesTags: ['profile'],
    }),

    updateLanguage: builder.mutation({
      query: ({ language }) => ({
        url: "user/language",
        method: "POST",
        body: { language },
      }),
      invalidatesTags: ['profile'],
    }),

    getAvailableTags: builder.query({
      query: () => "user/available/tags",
      transformResponse: (response) => {
        // Handle different response structures
        if (Array.isArray(response)) {
          return response;
        }
        // If response has data property, return the data array
        if (response?.data && Array.isArray(response.data)) {
          return response.data;
        }
        // If response has tags property, return the tags array
        if (response?.tags && Array.isArray(response.tags)) {
          return response.tags;
        }
        // Fallback to empty array
        return [];
      },
    }),
    updateProfile: builder.mutation({
      query: (payload) => {
        // Accept either a plain object or a FormData; always send multipart when file is present
        let body;
        let headers = {};
        if (payload instanceof FormData) {
          body = payload;
          // Laravel requires _method: 'PATCH' in FormData when using POST to simulate PATCH
          if (!body.has('_method')) {
            body.append('_method', 'PATCH');
          }
        } else {
          body = new FormData();
          Object.entries(payload || {}).forEach(([k, v]) => {
            if (Array.isArray(v)) {
              v.forEach(val => body.append(`${k}[]`, val));
            } else if (v !== undefined && v !== null) {
              body.append(k, v);
            }
          });
          body.append('_method', 'PATCH');
        }
        return {
          url: "user/profile/update",
          method: "POST", // Use POST for multipart/form-data
          body,
        };
      },
      invalidatesTags: ['profile'],
    }),

    // Submit a report with optional image. Accepts FormData or plain object
    submitReport: builder.mutation({
      query: (payload) => {
        let body;
        if (payload instanceof FormData) {
          body = payload;
        } else {
          body = new FormData();
          Object.entries(payload || {}).forEach(([k, v]) => {
            if (v !== undefined && v !== null) body.append(k, v);
          });
        }
        return {
          url: "reports",
          method: "POST",
          body,
        };
      },
    }),


    deleteTags: builder.mutation({
      query: (body = {}) => ({
        url: "user/profile/tags",
        method: "DELETE",
        body,
      }),
    }),

    // Export chat data and create report for admin
    exportChatsReport: builder.mutation({
      query: () => ({
        url: "reports/export-chats",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateMoodMutation,
  useUpdateLanguageMutation,
  useGetAvailableTagsQuery,
  useUpdateProfileMutation,
  useSubmitReportMutation,
  useExportChatsReportMutation,
  useDeleteTagsMutation,
} = userApi;
