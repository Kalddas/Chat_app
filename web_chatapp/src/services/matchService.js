import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const matchApi = createApi({
  reducerPath: "matchApi",
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
    findMatch: builder.query({
      query: () => "find/matches",
    }),

    getMatches: builder.query({
      query: (page = 1) => `matches?page=${page}`,
    }),

    updateTags: builder.mutation({
      query: (tags) => ({
        url: "update/tags",
        method: "POST",
        body: tags,
      }),
    }),

    searchUserByTag: builder.query({
      query: (tag_id) => `user/tag?tag_id=${tag_id}`,
    }),
  }),
});

export const {
  useFindMatchQuery,
  useGetMatchesQuery,
  useUpdateTagsMutation,
  useSearchUserByTagQuery,
} = matchApi;
