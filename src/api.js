// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

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
