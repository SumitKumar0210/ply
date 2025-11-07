// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

// List of public API endpoints that don't need token
const PUBLIC_ENDPOINTS = [
  "/login",
  "/forgot-password",
  "/public/quote/",
  "/public/order/",
  "/public/invoice/",
];

// Check if URL is a public endpoint
const isPublicEndpoint = (url) => {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

//  Attach token to every request
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

api.interceptors.request.use(
  (config) => {

    // Skip adding token for public endpoints
    if (isPublicEndpoint(config.url)) {
      config.headers = {
        ...config.headers, // keep other headers
        "Content-Type": "multipart/form-data",
      };
      return config;
    }
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = {
        ...config.headers, // keep other headers
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//  Handle expired token globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(error)
    if (error.status && error.status === 401) {
      const message = error.response.data?.error || "Unauthorized";

      if (message.includes("Token expired")) {
        // Show popup
        alert("⚠️ Session expired. Please login again."); // replace with custom modal if you want

        // Clear token
        localStorage.removeItem("token");

        // Redirect to login
        // window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
