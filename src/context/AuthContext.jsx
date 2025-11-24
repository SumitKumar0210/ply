import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const mediaUrl = import.meta.env.VITE_MEDIA_URL;

const AuthContext = createContext();

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/quotation", 
];

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
    company_address: "",
    gst_no: "",
  });

  // Check if current route is public
  const isPublicRoute = (pathname) => {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  };

  // Fetch app details
  useEffect(() => {
    const fetchAppDetails = async () => {
      const storedFavicon = localStorage.getItem("favicon");
      const storedLogo = localStorage.getItem("logo");
      const horizontalLogo = localStorage.getItem("horizontalLogo");
      const storedAppName = localStorage.getItem("application_name");
      const storedCompanyAddress = localStorage.getItem("company_address");
      const storedCompanyGst = localStorage.getItem("gst_no");

      if (storedFavicon && storedLogo && storedAppName && storedCompanyAddress && storedCompanyGst) {
        setAppDetails({
          favicon: storedFavicon,
          logo: storedLogo,
          application_name: storedAppName,
          horizontal_logo: horizontalLogo,
          company_address:storedCompanyAddress,
          gst_no: storedCompanyGst,
        });
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}app-details`);
       
        const appData = res.data.data[0];
        if (appData) {
          const favicon = appData.favicon ? mediaUrl + appData.favicon : "";
          const logo = appData.logo ? mediaUrl + appData.logo : "";
          const horizontalLogo = appData.horizontal_logo ? mediaUrl + appData.horizontal_logo : "";
          const applicationName = appData.app_name || "";

          localStorage.setItem("favicon", favicon);
          localStorage.setItem("logo", logo);
          localStorage.setItem("horizontalLogo", horizontalLogo);
          localStorage.setItem("application_name", applicationName);

          setAppDetails({
            favicon,
            logo,
            application_name: applicationName,
            horizontal_logo: horizontalLogo,
            company_address: appData.address ?? "",
            gst_no: appData.gst_no ?? "",
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
        console.error("Failed to fetch app details:", error);
      }
    };

    fetchAppDetails();
  }, []);

  // Check authentication - ONLY for protected routes
  useEffect(() => {
    const checkToken = async () => {
      // Skip auth check for public routes
      if (isPublicRoute(location.pathname)) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        // Only redirect to login if NOT on a public route
        if (!isPublicRoute(location.pathname)) {
          navigate("/login", { replace: true });
        }
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
          
          // If user is authenticated and on login/forget page, redirect to dashboard
          if (location.pathname === "/login" || location.pathname === "/forget") {
            navigate("/dashboard", { replace: true });
          }
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          if (!isPublicRoute(location.pathname)) {
            navigate("/login", { replace: true });
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        handleLogoutAndRedirect();
      }

      setLoading(false);
    };

    checkToken();
  }, [location.pathname]); // Re-run when route changes

  const handleLogoutAndRedirect = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    // Only redirect if not already on public route
    if (!isPublicRoute(location.pathname)) {
      navigate("/login", { replace: true });
    }
  };

  const login = (token) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    handleLogoutAndRedirect();
  };

  const refreshAppDetails = async () => {
    try {
      const res = await axios.get(`${BASE_URL}app-details`);
      
      const appData = res.data.data[0];
      if (appData) {
        const favicon = appData.favicon ? mediaUrl + appData.favicon : "";
        const logo = appData.logo ? mediaUrl + appData.logo : "";
        const horizontalLogo = appData.horizontal_logo ? mediaUrl + appData.horizontal_logo : "";
        const applicationName = appData.app_name || "";

        localStorage.setItem("favicon", favicon);
        localStorage.setItem("logo", logo);
        localStorage.setItem("horizontalLogo", horizontalLogo);
        localStorage.setItem("application_name", applicationName);

        setAppDetails({
          favicon,
          logo,
          application_name: applicationName,
          horizontal_logo: horizontalLogo,
          company_address: appData.address ?? "",
          gst_no: appData.gst_no ?? "",
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