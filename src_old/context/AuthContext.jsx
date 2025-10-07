import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // prevent flicker while checking

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Call backend to verify token
        const user = 'verify'
        const res = await axios.post(
          `${BASE_URL}auth/me`,   
          {},                     
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data.access_token) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Token check failed:", error);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    checkToken();
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

