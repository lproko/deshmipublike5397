import axios from "axios";

// Base API configuration
const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercept requests to simulate API calls with localStorage
api.interceptors.request.use(
  async (config) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses to simulate API responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
