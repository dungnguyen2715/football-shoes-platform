import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Add auth token if needed
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle error centrally
    return Promise.reject(error);
  },
);
