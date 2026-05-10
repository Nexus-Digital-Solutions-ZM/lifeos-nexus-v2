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
        duration: response.headers["x-response-time"],
      });
    }
  },
  error: (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const message = error.response?.data?.detail || error.message;
    console.error(`❌ [API] ${status || "NET_ERR"} ${error.config?.url}`, {
      message,
      status,
      details: process.env.NODE_ENV === "development" ? error.response?.data : undefined,
    });
  },
};

// ── Retry Logic ────────────────────────────────────────────────────────
const shouldRetry = (error: AxiosError): boolean => {
  const status = error.response?.status;
  const code = error.code;
  return (
    code === "ERR_NETWORK" ||
    code === "ECONNABORTED" ||
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
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      api.request(config).then(resolve).catch(reject);
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
});

// ── Request Interceptor ────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    logger.request(config);
    const { access } = Storage.getTokens();
    if (access && config.headers) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    if (config.headers) {
      config.headers["X-Request-ID"] = crypto.randomUUID?.() || Date.now().toString();
    }
    return config;
  },
  (error: AxiosError) => {
    logger.error(error);
    return Promise.reject(error);
  }
);

// ── Response Interceptor ───────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.response(response);
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    logger.error(error);

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };
    const status = error.response?.status;

    // ── 401: Token Expired ───────────────────────────────────────────
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          requestQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      isRefreshing = true;
      const { refresh } = Storage.getTokens();

      if (!refresh) {
        Storage.clearTokens();
        Storage.setUser(null);
        if (typeof window !== "undefined") window.location.href = "/login?expired=1";
        return Promise.reject(new Error("Session expired. Please log in again."));
      }

      try {
        const refreshResponse = await axios.post<{
          access_token: string;
          refresh_token: string;
        }>(
          `${API_URL}${CONFIG.endpoints.refresh}`,
          { refresh_token: refresh },
          { headers: { "Content-Type": "application/json" } }
        );

        const { access_token, refresh_token } = refreshResponse.data;
        Storage.setTokens(access_token, refresh_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        processQueue(null, access_token);
        return api.request(originalRequest);
      } catch (refreshError) {
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
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : CONFIG.retryDelay;
      console.warn(`⏱️ Rate limited. Retrying after ${waitTime}ms...`);
      await delay(waitTime);
      return api.request(originalRequest);
    }

    // ── Retryable Errors (5xx, Network) ─────────────────────────────
    if (shouldRetry(error) && originalRequest._retryCount === undefined) {
      originalRequest._retryCount = 0;
    }

    if (shouldRetry(error) && originalRequest._retryCount! < CONFIG.maxRetries) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const backoffDelay = CONFIG.retryDelay * 2 ** (originalRequest._retryCount - 1);
      console.warn(
        `🔄 Retrying (${originalRequest._retryCount}/${CONFIG.maxRetries}) after ${backoffDelay}ms...`
      );
      await delay(backoffDelay);
      return api.request(originalRequest);
    }

    // ── Formatted Error ──────────────────────────────────────────────
    const formattedError: ApiErrorResponse = {
      status: error.response?.status,
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message,
      error: error.response?.data?.error || "API_ERROR",
    };

    return Promise.reject(formattedError);
  }
);

// ── Named Token Helpers (consumed by auth-store & SSR) ────────────────
export const setTokens = (access: string, refresh: string): void =>
  Storage.setTokens(access, refresh);

export const clearTokens = (): void => Storage.clearTokens();

export const getTokens = (): AuthTokens => Storage.getTokens();

// ── Exported API Client ────────────────────────────────────────────────
export const apiClient = {
  instance: api,

  auth: {
    isAuthenticated: (): boolean => !!Storage.getTokens().access,
    getUser: (): LifeOSUser | null => Storage.getUser(),
    setUser: (user: LifeOSUser | null): void => Storage.setUser(user),
    logout: (): void => {
      Storage.clearTokens();
      Storage.setUser(null);
      api.post(CONFIG.endpoints.logout).catch(() => {});
    },
  },

  health: async (): Promise<{ status: string; service: string; version: string }> => {
    const response = await api.get<{ status: string; service: string; version: string }>(
      "/health"
    );
    return response.data;
  },

  // Keep on apiClient for backwards compat
  setTokens,
  clearTokens,
  getTokens,
};

export default api;