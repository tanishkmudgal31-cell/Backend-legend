import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const registerUser = async (userData) => {
  const response = await api.post(
    "/auth/register",
    userData
  );

  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post(
    "/auth/login",
    credentials
  );

  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post(
    "/auth/logout"
  );

  return response.data;
};

export const getMyAccounts = async () => {
  const response = await api.get(
    "/accounts/me"
  );

  return response.data;
};

export const getAccountBalance = async (accountId) => {
  const response = await api.get(
    `/accounts/balance/${accountId}`
  );

  return response.data;
};

export const getRecentTransactions = async () => {
  const response = await api.get(
    "/transactions",
    {
      params: {
        page: 1,
        limit: 5,
      },
    }
  );

  return response.data;
};

export const createTransaction = async (
  transactionData
) => {
  const response = await api.post(
    "/transactions/create",
    transactionData
  );

  return response.data;
};

export const createAccount = async (
  accountData = {}
) => {
  const response = await api.post(
    "/accounts",
    accountData
  );

  return response.data;
};

export default api;