import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../services/authService";
import { chatApi } from "../services/chatService"; 
import { userApi } from "../services/userService";
import { adminApi } from "../services/adminService";
import { matchApi } from "../services/matchService";
import { reportApi } from "../services/reportService";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer, 
    [userApi.reducerPath]: userApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [matchApi.reducerPath]: matchApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(chatApi.middleware)
      .concat(userApi.middleware)
      .concat(adminApi.middleware)
      .concat(matchApi.middleware)
      .concat(reportApi.middleware),
});
