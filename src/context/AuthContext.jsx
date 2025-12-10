import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { logout as reduxLogout, setUser as reduxSetUser } from "../pages/auth/authSlice";
import { capitalize } from "lodash";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const mediaUrl = import.meta.env.VITE_MEDIA_URL;

// Configure axios interceptor for global 401 handling
let isInterceptorSetup = false;
const setupAxiosInterceptor = (logoutCallback) => {
  if (isInterceptorSetup) return;
  
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.warn("Token expired or unauthorized");
        logoutCallback();
      }
      return Promise.reject(error);
    }
  );
  
  isInterceptorSetup = true;
};

const AuthContext = createContext();

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/quotation/", 
];

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get auth state from Redux
  const reduxAuth = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [initialCheck, setInitialCheck] = useState(true);
  
  const [user, setUser] = useState({
    name: "",
    profileImage: "",
    type: "",
    roles: [],
    permissions: []
  });

  const [appDetails, setAppDetails] = useState(() => {
    return {
      favicon: localStorage.getItem("favicon") || "",
      logo: localStorage.getItem("logo") || "",
      application_name: localStorage.getItem("application_name") || "",
      horizontal_logo: localStorage.getItem("horizontalLogo") || "",
      company_address: localStorage.getItem("company_address") || "",
      gst_no: localStorage.getItem("gst_no") || "",
    };
  });

  // Memoize public route check
  const isPublicRoute = useCallback((pathname) => {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  }, []);

  // Permission check helper
  const hasPermission = useCallback((permission) => {
    if (!user.permissions || user.permissions.length === 0) return false;
    return user.permissions.includes(permission);
  }, [user.permissions]);

  // Check multiple permissions (OR logic - user has any of the permissions)
  const hasAnyPermission = useCallback((permissions) => {
    if (!user.permissions || user.permissions.length === 0) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }, [user.permissions]);

  // Check multiple permissions (AND logic - user has all permissions)
  const hasAllPermissions = useCallback((permissions) => {
    if (!user.permissions || user.permissions.length === 0) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  }, [user.permissions]);

  // Check if user has a specific role
  const hasRole = useCallback((role) => {
    if (!user.roles || user.roles.length === 0) return false;
    return user.roles.includes(role);
  }, [user.roles]);

  // Fetch app details - runs only once on mount
  useEffect(() => {
    const fetchAppDetails = async () => {
      const hasAllData = 
        localStorage.getItem("favicon") &&
        localStorage.getItem("logo") &&
        localStorage.getItem("application_name") &&
        localStorage.getItem("company_address") &&
        localStorage.getItem("gst_no");

      if (hasAllData) return;

      try {
        const res = await axios.get(`${BASE_URL}app-details`);
        const appData = res.data.data[0];
        
        if (appData) {
          const newAppDetails = {
            favicon: appData.favicon ? mediaUrl + appData.favicon : "",
            logo: appData.logo ? mediaUrl + appData.logo : "",
            application_name: appData.app_name || "",
            horizontal_logo: appData.horizontal_logo ? mediaUrl + appData.horizontal_logo : "",
            company_address: appData.address ?? "",
            gst_no: appData.gst_no ?? "",
          };

          localStorage.setItem("favicon", newAppDetails.favicon);
          localStorage.setItem("logo", newAppDetails.logo);
          localStorage.setItem("horizontalLogo", newAppDetails.horizontal_logo);
          localStorage.setItem("application_name", newAppDetails.application_name);
          localStorage.setItem("company_address", newAppDetails.company_address);
          localStorage.setItem("gst_no", newAppDetails.gst_no);

          setAppDetails(newAppDetails);

          if (newAppDetails.favicon) {
            const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = newAppDetails.favicon;
            document.getElementsByTagName('head')[0].appendChild(link);
          }

          if (newAppDetails.application_name) {
            document.title = newAppDetails.application_name;
          }
        }
      } catch (error) {
        console.error("Failed to fetch app details:", error);
      }
    };

    fetchAppDetails();
  }, []);

  const handleLogoutAndRedirect = useCallback(() => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("redirectAfterLogin");
    dispatch(reduxLogout());
    setUser({ name: "", profileImage: "", type: "", roles: [], permissions: [] });
    
    if (!isPublicRoute(location.pathname)) {
      navigate("/login", { replace: true });
    }
  }, [location.pathname, navigate, isPublicRoute, dispatch]);

  // Setup axios interceptor once
  useEffect(() => {
    setupAxiosInterceptor(handleLogoutAndRedirect);
  }, [handleLogoutAndRedirect]);

  // Listen for Redux auth events (login/logout from other components)
  useEffect(() => {
    const handleAuthLogin = (event) => {
      const { token } = event.detail;
      if (token) {
        checkAuthUser(token);
      }
    };

    const handleAuthLogout = () => {
      handleLogoutAndRedirect();
    };

    window.addEventListener('auth-login', handleAuthLogin);
    window.addEventListener('auth-logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth-login', handleAuthLogin);
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, [handleLogoutAndRedirect]);

  // Check user data when authenticated
  const checkAuthUser = useCallback(async (token) => {
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

      if (res.data.user.access_token) {
        const userData = {
          name: res.data.user.name ?? "",
          profileImage: res.data.user.image ? mediaUrl + res.data.user.image : "",
          type: capitalize(res.data.roles[0]) ?? "",
          roles: res.data.roles || [],
          permissions: res.data.permissions || []
        };
        
        setUser(userData);
        dispatch(reduxSetUser(userData));
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }, [dispatch]);

  // Check authentication ONLY ONCE on mount
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setLoading(false);
        setInitialCheck(false);
        
        if (!isPublicRoute(location.pathname)) {
          sessionStorage.setItem("redirectAfterLogin", location.pathname);
          navigate("/login", { replace: true });
        }
        return;
      }

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

        if (res.data.user.access_token) {
          const userData = {
            name: res.data.user.name ?? "",
            profileImage: res.data.user.image ? mediaUrl + res.data.user.image : "",
            type: capitalize(res.data.roles[0]) ?? "",
            roles: res.data.roles || [],
            permissions: res.data.permissions || []
          };
          
          setUser(userData);
          dispatch(reduxSetUser(userData));
          
          if (isPublicRoute(location.pathname)) {
            const redirectPath = sessionStorage.getItem("redirectAfterLogin");
            
            if (redirectPath && !isPublicRoute(redirectPath)) {
              sessionStorage.removeItem("redirectAfterLogin");
              navigate(redirectPath, { replace: true });
            } else {
              navigate("/dashboard", { replace: true });
            }
          }
        } else {
          handleLogoutAndRedirect();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        handleLogoutAndRedirect();
      } finally {
        setLoading(false);
        setInitialCheck(false);
      }
    };

    checkToken();
  }, []);

  // Handle route protection without API calls
  useEffect(() => {
    if (initialCheck) return;

    const currentPath = location.pathname;
    const token = localStorage.getItem("token");

    if (!token && !isPublicRoute(currentPath)) {
      sessionStorage.setItem("redirectAfterLogin", currentPath);
      navigate("/login", { replace: true });
      return;
    }

    if (token && reduxAuth.isAuthenticated && isPublicRoute(currentPath)) {
      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      
      if (redirectPath && !isPublicRoute(redirectPath)) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [location.pathname, reduxAuth.isAuthenticated, initialCheck, isPublicRoute]);

  // Optional: Refresh token periodically (every 15 minutes)
  useEffect(() => {
    if (!reduxAuth.isAuthenticated) return;

    const refreshToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

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
          localStorage.setItem("token", res.data.access_token);
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    };

    const interval = setInterval(refreshToken, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [reduxAuth.isAuthenticated]);

  const login = useCallback((token) => {
    localStorage.setItem("token", token);
    
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    
    if (redirectPath && !isPublicRoute(redirectPath)) {
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(redirectPath, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, isPublicRoute]);

  const logout = useCallback(() => {
    handleLogoutAndRedirect();
  }, [handleLogoutAndRedirect]);

  const refreshAppDetails = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}app-details`);
      const appData = res.data.data[0];
      
      if (appData) {
        const newAppDetails = {
          favicon: appData.favicon ? mediaUrl + appData.favicon : "",
          logo: appData.logo ? mediaUrl + appData.logo : "",
          application_name: appData.app_name || "",
          horizontal_logo: appData.horizontal_logo ? mediaUrl + appData.horizontal_logo : "",
          company_address: appData.address ?? "",
          gst_no: appData.gst_no ?? "",
        };

        localStorage.setItem("favicon", newAppDetails.favicon);
        localStorage.setItem("logo", newAppDetails.logo);
        localStorage.setItem("horizontalLogo", newAppDetails.horizontal_logo);
        localStorage.setItem("application_name", newAppDetails.application_name);
        localStorage.setItem("company_address", newAppDetails.company_address);
        localStorage.setItem("gst_no", newAppDetails.gst_no);

        setAppDetails(newAppDetails);

        if (newAppDetails.favicon) {
          const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = newAppDetails.favicon;
          document.getElementsByTagName('head')[0].appendChild(link);
        }

        if (newAppDetails.application_name) {
          document.title = newAppDetails.application_name;
        }
      }
    } catch (error) {
      console.error("Failed to refresh app details:", error);
    }
  }, []);

  const contextValue = useMemo(() => ({
    isAuthenticated: reduxAuth.isAuthenticated,
    login,
    logout,
    user,
    setUser,
    loading,
    appDetails,
    refreshAppDetails,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole
  }), [
    reduxAuth.isAuthenticated, 
    login, 
    logout, 
    user, 
    loading, 
    appDetails, 
    refreshAppDetails,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole
  ]);

  if (initialCheck && loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};