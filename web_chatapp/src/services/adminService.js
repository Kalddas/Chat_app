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
      transformResponse: (response) => ({
        users: response.users || [],
        total: response.total || 0,
      }),
    }),
    searchUser: builder.query({
      query: (search) => `admin/users?search=${search}`,
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
