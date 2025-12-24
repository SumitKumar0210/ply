// ./context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo
} from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { logout as reduxLogout, setUser as reduxSetUser } from "../pages/auth/authSlice";
import { capitalize } from "lodash";

const BASE_URL = import.meta.env.VITE_BASE_URL || "/";
const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || "";

const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/quotation/",
];

const AuthContext = createContext();

export const AuthProvider = ({ children, eager = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // cached_user (optional) for optimistic UI
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem("cached_user") || "null");
  } catch (e) {
    cached = null;
  }

  const [user, setUser] = useState(cached);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem("token")));
  const [fetchingAppDetails, setFetchingAppDetails] = useState(false);

  // appDetails state
  const [appDetails, setAppDetails] = useState(() => {
    try {
      const raw = localStorage.getItem("app_details");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  // axios instance
  const api = axios.create({ baseURL: BASE_URL, withCredentials: false });

  api.interceptors.request.use((cfg) => {
    const t = localStorage.getItem("token");
    if (t) cfg.headers = { ...cfg.headers, Authorization: `Bearer ${t}` };
    return cfg;
  });

  api.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err?.response?.status === 401) {
        window.dispatchEvent(new Event("auth-logout"));
      }
      return Promise.reject(err);
    }
  );

  // Apply user to context + redux + local cache
  const applyUser = useCallback(
    (u) => {
      if (!isMountedRef.current) return;
      setUser(u);
      try {
        localStorage.setItem("cached_user", JSON.stringify(u || {}));
      } catch (e) {}
      dispatch(reduxSetUser(u));
    },
    [dispatch]
  );

  const clearAuthAndRedirect = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("cached_user");
    dispatch(reduxLogout());
    if (isMountedRef.current) setUser(null);

    if (!PUBLIC_ROUTES.some((r) => location.pathname.startsWith(r))) {
      navigate("/login", { replace: true });
    }
  }, [dispatch, location.pathname, navigate]);

  // Background token validation
  const validateTokenInBg = useCallback(
    async (overrideToken = null) => {
      const token = overrideToken ?? localStorage.getItem("token");
      if (!token) {
        if (isMountedRef.current) setChecking(false);
        if (user) applyUser(null);
        return null;
      }

      setChecking(true);
      try {
        const res = await api.post(
          "/auth/me",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!isMountedRef.current) return null;

        const payloadUser = res.data?.user ?? res.data;
        const normalized = {
          name: payloadUser?.name ?? "",
          profileImage: payloadUser?.image
            ? MEDIA_URL + payloadUser.image
            : "",
          type: capitalize(res.data?.roles?.[0] ?? ""),
          roles: res.data?.roles ?? [],
          permissions: res.data?.permissions ?? [],
        };

        applyUser(normalized);
        return normalized;
      } catch (err) {
        if (isMountedRef.current) {
          applyUser(null);
          clearAuthAndRedirect();
        }
        return null;
      } finally {
        if (isMountedRef.current) setChecking(false);
      }
    },
    [api, applyUser, clearAuthAndRedirect, user]
  );

  // Run one-time background validation on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      validateTokenInBg();
    } else {
      setChecking(false);
    }

    const onLogin = (e) => {
      const t = e?.detail?.token;
      if (t) {
        localStorage.setItem("token", t);
        validateTokenInBg(t);
      }
    };

    const onLogout = () => {
      clearAuthAndRedirect();
    };

    window.addEventListener("auth-login", onLogin);
    window.addEventListener("auth-logout", onLogout);

    return () => {
      window.removeEventListener("auth-login", onLogin);
      window.removeEventListener("auth-logout", onLogout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (token) => {
      if (!token) return;
      localStorage.setItem("token", token);
      window.dispatchEvent(new CustomEvent("auth-login", { detail: { token } }));
      await validateTokenInBg(token);
    },
    [validateTokenInBg]
  );

  const logout = useCallback(() => {
    window.dispatchEvent(new Event("auth-logout"));
    clearAuthAndRedirect();
  }, [clearAuthAndRedirect]);

  // Permissions helpers
  const hasPermission = useCallback(
    (p) => !!(user?.permissions && user.permissions.includes(p)),
    [user]
  );

  const hasAnyPermission = useCallback(
    (arr) => !!(user?.permissions && arr.some((p) => user.permissions.includes(p))),
    [user]
  );

  const hasAllPermissions = useCallback(
    (arr) => !!(user?.permissions && arr.every((p) => user.permissions.includes(p))),
    [user]
  );

  const hasRole = useCallback(
    (r) => !!(user?.roles && user.roles.includes(r)),
    [user]
  );

  // Helper: Apply app details to DOM (favicon and title)
  const applyAppDetailsToDOM = useCallback((details) => {
    if (!details) return;

    // Set favicon
    if (details.favicon) {
      try {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "shortcut icon";
          link.type = "image/x-icon";
          document.getElementsByTagName("head")[0].appendChild(link);
        }
        link.href = details.favicon;
      } catch (e) {
        // ignore DOM failures
      }
    }

    // Set title
    if (details.application_name) {
      document.title = details.application_name;
    }
  }, []);

  // Helper: Save app details to localStorage
  const saveAppDetailsToStorage = useCallback((normalized) => {
    try {
      localStorage.setItem("app_details", JSON.stringify(normalized));
      // For backwards compatibility with other places reading separate keys:
      if (normalized.favicon)
        localStorage.setItem("favicon", normalized.favicon);
      if (normalized.logo) localStorage.setItem("logo", normalized.logo);
      if (normalized.horizontal_logo)
        localStorage.setItem("horizontalLogo", normalized.horizontal_logo);
      if (normalized.application_name)
        localStorage.setItem("application_name", normalized.application_name);
      if (normalized.company_address)
        localStorage.setItem("company_address", normalized.company_address);
      if (normalized.gst_no)
        localStorage.setItem("gst_no", normalized.gst_no);
    } catch (e) {
      // ignore localStorage write errors
    }
  }, []);

  // Fetch app details from API
  const fetchAppDetails = useCallback(
    async (forceRefresh = false) => {
      // If not forcing refresh, check cache first
      if (!forceRefresh) {
        try {
          const stored = localStorage.getItem("app_details");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (isMountedRef.current) setAppDetails(parsed);
            return parsed;
          }
        } catch (e) {
          // ignore parse errors and re-fetch
        }
      }

      // Set loading state
      if (isMountedRef.current) setFetchingAppDetails(true);

      try {
        const res = await api.get("/app-details");
        if (!isMountedRef.current) return null;

        const appData = res?.data?.data?.[0] ?? res?.data ?? null;
        if (!appData) {
          if (isMountedRef.current) setFetchingAppDetails(false);
          return null;
        }

        const normalized = {
          favicon: appData.favicon ? MEDIA_URL + appData.favicon : "",
          logo: appData.logo ? MEDIA_URL + appData.logo : "",
          horizontal_logo: appData.horizontal_logo
            ? MEDIA_URL + appData.horizontal_logo
            : "",
          application_name: appData.app_name ?? "",
          company_address: appData.address ?? "",
          gst_no: appData.gst_no ?? "",
        };

        // Save to storage
        saveAppDetailsToStorage(normalized);

        if (isMountedRef.current) {
          setAppDetails(normalized);
          applyAppDetailsToDOM(normalized);
        }

        return normalized;
      } catch (err) {
        // Network or other error
        if (err?.name === "CanceledError" || err?.name === "AbortError")
          return null;
        console.error("Failed to fetch app details:", err);
        return null;
      } finally {
        if (isMountedRef.current) setFetchingAppDetails(false);
      }
    },
    [api, saveAppDetailsToStorage, applyAppDetailsToDOM]
  );

  // Public refresh function - always forces re-fetch from server
  const refreshAppDetails = useCallback(async () => {
    return await fetchAppDetails(true);
  }, [fetchAppDetails]);

  // Run fetchAppDetails on mount if appDetails missing
  useEffect(() => {
    if (!appDetails) {
      fetchAppDetails(false);
    } else {
      // Ensure document title and favicon reflect cached appDetails
      applyAppDetailsToDOM(appDetails);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const value = useMemo(
    () => ({
      user,
      appDetails,
      fetchingAppDetails,
      login,
      logout,
      refreshAppDetails,
      checking,
      isAuthenticated: !!localStorage.getItem("token"),
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
    }),
    [
      user,
      appDetails,
      fetchingAppDetails,
      login,
      logout,
      refreshAppDetails,
      checking,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};