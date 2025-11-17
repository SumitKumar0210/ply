import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const mediaUrl = import.meta.env.VITE_MEDIA_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState({
    name: "",
    profileImage: "",
    type: ""
  });

  const [appDetails, setAppDetails] = useState({
    favicon: "",
    logo: "",
    application_name: "",
    horizontal_logo: "",
  });

  // Fetch app details
  useEffect(() => {
    const fetchAppDetails = async () => {
      // Check if app details exist in localStorage
      const storedFavicon = localStorage.getItem("favicon");
      const storedLogo = localStorage.getItem("logo");
      const horizontalLogo = localStorage.getItem("horizontalLogo");
      const storedAppName = localStorage.getItem("application_name");

      if (storedFavicon && storedLogo && storedAppName) {
        // Use stored data if available
        setAppDetails({
          favicon: storedFavicon,
          logo: storedLogo,
          application_name: storedAppName,
          horizontal_logo: horizontalLogo,
        });
        return;
      }

      // Fetch from API if not in localStorage
      try {
        const res = await axios.get(`${BASE_URL}app-details`);
       
        const appData = res.data.data[0];
        if (appData) {
          const favicon = appData.favicon ? mediaUrl + appData.favicon : "";
          const logo = appData.logo ? mediaUrl + appData.logo : "";
          const horizontalLogo = appData.horizontal_logo ? mediaUrl + appData.horizontal_logo : "";
          const applicationName = appData.app_name || "";

          // Store in localStorage
          localStorage.setItem("favicon", favicon);
          localStorage.setItem("logo", logo);
          localStorage.setItem("horizontalLogo", horizontalLogo);
          localStorage.setItem("application_name", applicationName);

          // Update state
          setAppDetails({
            favicon,
            logo,
            application_name: applicationName,
            horizontal_logo: horizontalLogo
          });

          // Update favicon dynamically
          if (favicon) {
            const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = favicon;
            document.getElementsByTagName('head')[0].appendChild(link);
          }

          // Update document title
          if (applicationName) {
            document.title = applicationName;
          }
        }
      } catch (error) {
        console.error("Failed to fetch app details:", error);
      }
    };

    fetchAppDetails();
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
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

  // Function to refresh app details (useful if data changes)
  const refreshAppDetails = async () => {
    try {
      const res = await axios.get(`${BASE_URL}app-details`);
      
        const appData = res.data.data[0];
        if (appData) {
          const favicon = appData.favicon ? mediaUrl + appData.favicon : "";
          const logo = appData.logo ? mediaUrl + appData.logo : "";
          const horizontalLogo = appData.horizontal_logo ? mediaUrl + appData.horizontal_logo : "";
          const applicationName = appData.app_name || "";

          // Store in localStorage
          localStorage.setItem("favicon", favicon);
          localStorage.setItem("logo", logo);
          localStorage.setItem("horizontalLogo", horizontalLogo);
          localStorage.setItem("application_name", applicationName);

        setAppDetails({
          favicon,
          logo,
          application_name: applicationName
        });

        if (favicon) {
          const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = favicon;
          document.getElementsByTagName('head')[0].appendChild(link);
        }

        if (applicationName) {
          document.title = applicationName;
        }
      }
    } catch (error) {
      console.error("Failed to refresh app details:", error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        login, 
        logout, 
        user, 
        setUser, 
        loading,
        appDetails,
        refreshAppDetails
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);