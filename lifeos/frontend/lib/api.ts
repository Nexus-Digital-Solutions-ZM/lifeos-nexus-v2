// frontend/src/lib/api.ts
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// ── Environment Validation ──────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined. Check your .env file.");
}

// Validate URL format in development only
if (process.env.NODE_ENV === "development") {
  try {
    new URL(API_URL);
  } catch {
    console.warn("⚠️ NEXT_PUBLIC_API_URL may be invalid:", API_URL);
  }
}

// ── Configuration ──────────────────────────────────────────────────────
const CONFIG = {
  baseURL: `${API_URL}/api/v1`,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 15000,
  maxRetries: Number(process.env.NEXT_PUBLIC_API_MAX_RETRIES) || 3,
  retryDelay: 1000,
  tokenPrefix: "lifeos_",
  endpoints: {
    refresh: "/auth/refresh",
    login: "/auth/login",
    logout: "/auth/logout",
  },
} as const;

// ── Types ──────────────────────────────────────────────────────────────
export interface AuthTokens {
  access: string | null;
  refresh: string | null;
}

export interface LifeOSUser {
  id: number;
  email: string;
  full_name?: string;
  role: string;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
  status?: number;
}

// Type guard to safely narrow unknown API error responses
const isApiErrorResponse = (data: unknown): data is ApiErrorResponse => {
  return (
    typeof data === "object" &&
    data !== null &&
    ("detail" in data || "message" in data || "error" in data)
  );
};

// Safe error type that handles Axios's unknown response data
type SafeAxiosError = AxiosError<unknown>;

// ── Secure Storage Abstraction ─────────────────────────────────────────
const Storage = {
  getTokens(): AuthTokens {
    if (typeof window === "undefined") return { access: null, refresh: null };
    try {
      return {
        access: localStorage.getItem(`${CONFIG.tokenPrefix}access`),
        refresh: localStorage.getItem(`${CONFIG.tokenPrefix}refresh`),
      };
    } catch (e) {
      console.error("🔐 Token read error:", e);
      return { access: null, refresh: null };
    }
  },

  setTokens(access: string, refresh: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${CONFIG.tokenPrefix}access`, access);
      localStorage.setItem(`${CONFIG.tokenPrefix}refresh`, refresh);
    } catch (e) {
      console.error("🔐 Token write error:", e);
      this.clearTokens();
    }
  },

  clearTokens(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(`${CONFIG.tokenPrefix}access`);
      localStorage.removeItem(`${CONFIG.tokenPrefix}refresh`);
      localStorage.removeItem(`${CONFIG.tokenPrefix}user`);
    } catch (e) {
      console.error("🔐 Token clear error:", e);
    }
  },

  getUser(): LifeOSUser | null {
    if (typeof window === "undefined") return null;
    try {
      const user = localStorage.getItem(`${CONFIG.tokenPrefix}user`);
      return user ? (JSON.parse(user) as LifeOSUser) : null;
    } catch {
      return null;
    }
  },

  setUser(user: LifeOSUser | null): void {
    if (typeof window === "undefined") return;
    try {
      if (user) {
        localStorage.setItem(`${CONFIG.tokenPrefix}user`, JSON.stringify(user));
      } else {
        localStorage.removeItem(`${CONFIG.tokenPrefix}user`);
      }
    } catch (e) {
      console.error("👤 User storage error:", e);
    }
  },
};

// ── Logging Utility ────────────────────────────────────────────────────
const logger = {
  request: (config: InternalAxiosRequestConfig) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`📤 [API] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        body: config.data,
      });
    }
  },
  response: (response: AxiosResponse) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`📥 [API] ${response.status} ${response.config.url}`, {
        duration: response.headers?.["x-response-time"],
      });
    }
  },
  // ✅ FIX: Accept SafeAxiosError and safely extract error details
  error: (error: SafeAxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Safely extract message with type guard
    const message = isApiErrorResponse(data)
      ? data.detail || data.message
      : typeof data === "string"
      ? data
      : error.message;

    // Log to monitoring service in production (uncomment when ready)
    // if (process.env.NODE_ENV === "production" && typeof Sentry !== "undefined") {
    //   Sentry.captureException(error, { extra: { url: error.config?.url, status } });
    // }

    console.error(`❌ [API] ${status || "NET_ERR"} ${error.config?.url}`, {
      message,
      status,
      code: error.code,
      details: process.env.NODE_ENV === "development" ? data : undefined,
    });
  },
};

// ── Retry Logic with Exponential Backoff ───────────────────────────────
const shouldRetry = (error: SafeAxiosError): boolean => {
  const status = error.response?.status;
  const code = error.code;
  
  // Retry on: network errors, timeouts, 5xx server errors, 429 rate limits
  return (
    code === "ERR_NETWORK" ||
    code === "ECONNABORTED" ||
    code === "ERR_TIMEOUT" ||
    (status !== undefined && status >= 500) ||
    status === 429
  );
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Request Queue for Token Refresh ────────────────────────────────────
interface QueuedRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: AxiosRequestConfig;
}

let isRefreshing = false;
let requestQueue: QueuedRequest[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  requestQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else if (token) {
      // Clone config to avoid mutating original
      const retryConfig = { ...config, headers: { ...config.headers, Authorization: `Bearer ${token}` } };
      api.request(retryConfig).then(resolve).catch(reject);
    }
  });
  requestQueue = [];
};

// ── Axios Instance ─────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: CONFIG.baseURL,
  timeout: CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Version": process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  },
  // Don't throw on 4xx/5xx — let interceptors handle them
  validateStatus: (status) => status < 500,
});

// ── Request Interceptor ────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    logger.request(config);
    
    const { access } = Storage.getTokens();
    if (access && config.headers) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    
    // Add request ID for tracing (safe fallback for older browsers)
    if (config.headers) {
      try {
        config.headers["X-Request-ID"] = 
          (typeof crypto !== "undefined" && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      } catch {
        config.headers["X-Request-ID"] = Date.now().toString();
      }
    }
    
    return config;
  },
  // ✅ FIX: Handle SafeAxiosError properly
  (error: SafeAxiosError) => {
    logger.error(error);
    return Promise.reject(error);
  }
);

// ── Response Interceptor with Auto-Refresh & Retry ─────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.response(response);
    return response;
  },
  // ✅ FIX: Accept SafeAxiosError and handle safely
  async (error: SafeAxiosError) => {
    logger.error(error);

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };
    const status = error.response?.status;

    // ── 401: Token Expired / Unauthorized ────────────────────────────
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          requestQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      isRefreshing = true;
      const { refresh } = Storage.getTokens();

      // No refresh token? Force logout
      if (!refresh) {
        Storage.clearTokens();
        Storage.setUser(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login?expired=1";
        }
        return Promise.reject(new Error("Session expired. Please log in again."));
      }

      try {
        // Attempt token refresh with dedicated axios call (bypass interceptors)
        const refreshResponse = await axios.post<{
          access_token: string;
          refresh_token: string;
        }>(
          `${API_URL}${CONFIG.endpoints.refresh}`,
          { refresh_token: refresh },
          { 
            headers: { "Content-Type": "application/json" },
            timeout: CONFIG.timeout,
          }
        );

        const { access_token, refresh_token } = refreshResponse.data;
        Storage.setTokens(access_token, refresh_token);

        // Update header for original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        // Process queued requests with new token
        processQueue(null, access_token);

        // Retry original request
        return api.request(originalRequest);
      } catch (refreshError) {
        // Refresh failed: clear session and redirect
        processQueue(new Error("Token refresh failed"), null);
        Storage.clearTokens();
        Storage.setUser(null);
        
        if (typeof window !== "undefined") {
          window.location.href = "/login?error=session_expired";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 429: Rate Limited ────────────────────────────────────────────
    if (status === 429) {
      const retryAfter = error.response?.headers?.["retry-after"];
      const waitTime = retryAfter 
        ? Math.min(parseInt(retryAfter as string, 10) * 1000, 30000) // Cap at 30s
        : CONFIG.retryDelay;
      
      console.warn(`⏱️ Rate limited. Retrying after ${waitTime}ms...`);
      await delay(waitTime);
      return api.request(originalRequest);
    }

    // ── Retryable Errors (5xx, Network, Timeout) ─────────────────────
    if (shouldRetry(error)) {
      // Initialize retry count if not present
      if (originalRequest._retryCount === undefined) {
        originalRequest._retryCount = 0;
      }

      // Retry with exponential backoff if under max attempts
      if (originalRequest._retryCount < CONFIG.maxRetries) {
        originalRequest._retryCount += 1;
        const backoffDelay = Math.min(
          CONFIG.retryDelay * 2 ** (originalRequest._retryCount - 1),
          10000 // Cap at 10s
        );
        
        console.warn(
          `🔄 Retrying (${originalRequest._retryCount}/${CONFIG.maxRetries}) after ${backoffDelay}ms...`
        );
        await delay(backoffDelay);
        return api.request(originalRequest);
      }
    }

    // ── Format Error for Application Layer ───────────────────────────
    const data = error.response?.data;
    const formattedError: ApiErrorResponse = {
      status: error.response?.status,
      message: isApiErrorResponse(data)
        ? data.detail || data.message || error.message
        : error.message,
      error: isApiErrorResponse(data) && data.error ? data.error : "API_ERROR",
    };

    return Promise.reject(formattedError);
  }
);

// ── Named Token Helpers (for backward compatibility & SSR) ─────────────
export const setTokens = (access: string, refresh: string): void =>
  Storage.setTokens(access, refresh);

export const clearTokens = (): void => Storage.clearTokens();

export const getTokens = (): AuthTokens => Storage.getTokens();

export const getUser = (): LifeOSUser | null => Storage.getUser();

export const setUser = (user: LifeOSUser | null): void => Storage.setUser(user);

// ── Exported API Client ────────────────────────────────────────────────
export const apiClient = {
  // Raw axios instance for advanced use cases
  instance: api,

  // Auth helpers
  auth: {
    isAuthenticated: (): boolean => !!Storage.getTokens().access,
    getUser: (): LifeOSUser | null => Storage.getUser(),
    setUser: (user: LifeOSUser | null): void => Storage.setUser(user),
    logout: (): void => {
      Storage.clearTokens();
      Storage.setUser(null);
      // Fire-and-forget logout notification to backend
      api.post(CONFIG.endpoints.logout).catch(() => {});
    },
  },

  // Health check endpoint
  health: async (): Promise<{ status: string; service: string; version: string }> => {
    const response = await api.get<{ status: string; service: string; version: string }>(
      "/health",
      { timeout: 5000 } // Short timeout for health checks
    );
    return response.data;
  },

  // Token management (exposed for SSR/hydration scenarios)
  setTokens,
  clearTokens,
  getTokens,
};

// ── Default Export: Raw Axios Instance ─────────────────────────────────
export default api;