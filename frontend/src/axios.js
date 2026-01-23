import axios from "axios";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";

let store;

export const injectStore = (_store) => {
  store = _store;
};

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/web",
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      // Initialize MSAL if not already done
      await msalInstance.initialize();
      
      const accounts = msalInstance.getAllAccounts();
      const activeAccount = msalInstance.getActiveAccount() || accounts[0];

      if (activeAccount) {
        try {
          const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: activeAccount
          });
          
          config.headers.Authorization = `Bearer ${response.accessToken}`;
          console.log("Token attached to request");
        } catch (error) {
          console.error("Silent token acquisition failed:", error);
        }
      } else {
        console.log("No active account found for token");
      }
    } catch (error) {
      console.error("MSAL initialization error:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("401 Unauthorized - Token may be invalid");
    }
    return Promise.reject(error);
  }
);

export default api;