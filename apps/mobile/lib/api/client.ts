import { FranchiseAPI } from "@franchise/api-client";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "../auth/storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://thefranchiselagos.com.ng";

export const api = new FranchiseAPI({
  baseUrl: API_URL,

  getToken: getAccessToken,

  getRefreshToken: getRefreshToken,

  onTokensRefreshed: async (accessToken, refreshToken) => {
    await saveTokens(accessToken, refreshToken);
  },

  onUnauthorized: () => {
    // Lazy import avoids circular dep: store → api → store
    clearTokens().then(() => {
      import("../auth/store").then(({ useAuthStore }) => {
        useAuthStore.getState()._clearAuth();
      });
    });
  },
});
