import axios from "axios";

// Base API configuration
const api = axios.create({
  baseURL: "https://serverstand.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  // Security: Prevent DoS attack through large response payloads
  maxContentLength: 10 * 1024 * 1024, // 10MB max response size
  maxBodyLength: 10 * 1024 * 1024, // 10MB max request body size
  timeout: 30000, // 30 second timeout to prevent hanging requests
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
