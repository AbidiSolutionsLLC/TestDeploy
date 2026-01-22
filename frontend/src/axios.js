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
  baseURL: "/api/web",
  timeout: 30000,
});


api.interceptors.request.use(async (config) => {
  const accounts = msalInstance.getAllAccounts();
  const activeAccount =
    msalInstance.getActiveAccount() || accounts[0];

  if (activeAccount) {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: activeAccount,
    });

    config.headers.Authorization = `Bearer ${response.accessToken}`;
  }

  return config;
});

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