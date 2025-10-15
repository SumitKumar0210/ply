import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation  } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BASE_URL;
const AuthContext = createContext();
const mediaUrl = import.meta.env.VITE_MEDIA_URL;

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); 
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({
    name: "",
    profileImage: "",
    type:""
  });

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Call backend to verify token
        
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
           setUser({
              name: res.data.name ?? "",
              profileImage: res.data.image ? mediaUrl + res.data.image : "",
              type: res.data.user_type?.name ?? "",
            });
          if (location.pathname === "/login" || location.pathname === "/forget") {
            navigate("/dashboard", { replace: true });
          }
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch (error) {
        
        handleLogoutAndRedirect();
      }

      setLoading(false);
    };

    checkToken();
  }, []);

  const handleLogoutAndRedirect = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  };

  const login = (token) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    handleLogoutAndRedirect();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, setUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

