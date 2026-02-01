import axios from "axios";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";
import { toast } from "react-toastify"; // Import toast

let store;

export const injectStore = (_store) => {
  store = _store;
};

const msalInstance = new PublicClientApplication(msalConfig);
let msalInitialized = false;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/web",
  timeout: 30000,
  withCredentials: true 
});

api.interceptors.request.use(
  async (config) => {
    try {
      if (!msalInitialized) {
        await msalInstance.initialize();
        msalInitialized = true;
      }
      
      const accounts = msalInstance.getAllAccounts();
      const activeAccount = msalInstance.getActiveAccount() || accounts[0];

      if (activeAccount) {
        try {
          const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: activeAccount
          });
          config.headers.Authorization = `Bearer ${response.accessToken}`;
        } catch (error) {
          console.error("Silent token acquisition failed:", error);
        }
      }
    } catch (error) {
      console.error("MSAL initialization error:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- UPDATED RESPONSE INTERCEPTOR FOR TOASTS ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract the exact message we set in globalErrorHandler.js
    const message = error.response?.data?.message || "An unexpected error occurred";

    if (error.response?.status === 401) {
      console.error("401 Unauthorized");
      // Optional: window.location.href = '/auth/login';
    }

    // Automatically trigger a toast for 403 (Forbidden) and 400 (Bad Request)
    if (error.response?.status === 403 || error.response?.status === 400) {
      toast.error(message); // This will show your "Permission Denied" message!
    }

    // Also trigger for 500 so you know when the server crashes
    if (error.response?.status === 500) {
      toast.error("Internal Server Error: Please check backend logs.");
    }

    return Promise.reject(error);
  }
);

export default api;