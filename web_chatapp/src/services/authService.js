// src/services/authService.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const authApi = createApi({
  reducerPath: "authApi",
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
    login: builder.mutation({
      query: (credentials) => ({
        url: "login",
        method: "POST",
        body: credentials,
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: "logout",
        method: "POST",
      }),
    }),

    register: builder.mutation({
      query: (body) => ({
        url: "register",
        method: "POST",
        body,
      }),
    }),

    getTags: builder.query({
      query: () => "tags",
    }),

    resendOtp: builder.mutation({
      query: (email) => ({
        url: "email/verification/otp",
        method: "POST",
        body: { email },
      }),
    }),

    verifyOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: "email/verification/verify",
        method: "POST",
        body: { email, otp },
      }),
    }),

    forgotPassword: builder.mutation({
      query: (email) => ({
        url: "password/forgot",
        method: "POST",
        body: { email },
      }),
    }),

    resetPassword: builder.mutation({
      query: ({ email, token, password, password_confirmation }) => ({
        url: "password/reset",
        method: "POST",
        body: { email, token, password, password_confirmation },
      }),
    }),

    changePassword: builder.mutation({
      query: ({ old_password, new_password, new_password_confirmation }) => ({
        url: "change-password",
        method: "POST",
        body: { old_password, new_password, password_confirmation: new_password_confirmation },
      }),
    }),

    deleteAccount: builder.mutation({
      query: ({ password }) => ({
        url: "delete-account",
        method: "POST",
        body: { password },
      }),
    }),

    getMatches: builder.query({
      query: (page = 1) => `matches?page=${page}`,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetTagsQuery,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useLogoutMutation,
  useResetPasswordMutation,
  useVerifyOtpMutation,
  useGetMatchesQuery,
  useChangePasswordMutation,
  useDeleteAccountMutation,
} = authApi;
