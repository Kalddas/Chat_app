import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const reportApi = createApi({
  reducerPath: "reportApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:8000/api",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      console.log("ReportService: Preparing headers", { token: token ? "present" : "missing" });
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Report"],
  endpoints: (builder) => ({
    // ✅ User submits a report (normal user)
    submitReport: builder.mutation({
      query: (reportData) => {
        console.log("ReportService: Submitting report to API", {
          url: "reports",
          method: "POST",
          body: reportData,
        });
        return {
          url: "reports",
          method: "POST",
          body: reportData,
        };
      },
      invalidatesTags: ["Report"],
    }),

    // ✅ Get all reports (ADMIN only)
    getAllReports: builder.query({
      query: () => "admin/reports", // ✅ fixed path
      providesTags: ["Report"],
    }),

    // ✅ Get a single report (ADMIN only)
    getReportById: builder.query({
      query: (reportId) => `admin/reports/${reportId}`, // ✅ fixed path
      providesTags: ["Report"],
    }),

    // ✅ Update report status (ADMIN only)
    updateReportStatus: builder.mutation({
      query: ({ reportId, status }) => ({
        url: `admin/reports/${reportId}/status`, // ✅ fixed path
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Report"],
    }),
  }),
});

export const {
  useSubmitReportMutation,
  useGetAllReportsQuery,
  useGetReportByIdQuery,
  useUpdateReportStatusMutation,
} = reportApi;
