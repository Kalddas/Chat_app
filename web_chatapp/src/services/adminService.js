// src/services/adminService.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:8000/api", // Local Laravel backend
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Normalize backend pagination shapes into:
    // { current_page, total_pages, total_items, per_page }
    // Backend currently returns either:
    // - pagination.last_page (search endpoint)
    // - pagination.total_pages (all-users endpoint)
    //
    // Keep both working by mapping to a single consistent shape for the UI.
    getDashboardResult: builder.query({
      query: () => "admin/dashboard",
    }),
    getActionLogs: builder.query({
      query: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return `admin/action-logs${q ? `?${q}` : ""}`;
      },
    }),
    getAllUser: builder.query({
      query: (page = 1) => `admin/users/all?page=${page}`,
      transformResponse: (response) => {
        const p = response?.pagination || {};
        return {
          users: response?.users || [],
          pagination: {
            current_page: p.current_page ?? 1,
            total_pages: p.total_pages ?? p.last_page ?? 1,
            total_items: p.total_items ?? p.total ?? 0,
            per_page: p.per_page ?? 10,
          },
        };
      },
    }),
    searchUser: builder.query({
      query: (search) => `admin/users?search=${search}`,
      transformResponse: (response) => {
        const p = response?.pagination || {};
        return {
          users: response?.users || [],
          pagination: {
            current_page: p.current_page ?? 1,
            total_pages: p.total_pages ?? p.last_page ?? 1,
            total_items: p.total_items ?? p.total ?? 0,
            per_page: p.per_page ?? 10,
          },
        };
      },
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `admin/users/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
    }),
    removeUser: builder.mutation({
      query: (id) => ({
        url: `admin/users/${id}`,
        method: "DELETE",
      }),
    }),
    getAllReports: builder.query({
      query: () => "admin/reports",
    }),
    showReport: builder.query({
      query: (id) => `admin/reports/${id}`,
    }),
    updateReportStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `admin/reports/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
    }),
  }),
});

export const {
  useGetDashboardResultQuery,
  useGetActionLogsQuery,
  useSearchUserQuery,
  useGetAllUserQuery,
  useUpdateUserStatusMutation,
  useRemoveUserMutation,
  useGetAllReportsQuery,
  useShowReportQuery,
  useUpdateReportStatusMutation,
} = adminApi;
