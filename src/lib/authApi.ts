/**
 * Authentication API Service
 *
 * Centralized service for all authentication-related API calls using axios.
 *
 * Architecture:
 * - Public axios instance (withCredentials: false) for unauthenticated endpoints
 * - Authenticated axios instance (withCredentials: true) for authenticated endpoints
 * - Request/response interceptors for consistent logging
 * - Proper axios error handling with type guards
 *
 * Endpoint Categories:
 * - PUBLIC: No credentials needed (nonce)
 * - AUTHENTICATED: Requires session cookie (login, me, logout, account)
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "../constants/app";
import { logger } from "../utils/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface NonceResponse {
  nonce: string;
  expiresAt: string;
}

export interface LoginRequest {
  message: string;
  signature: string;
}

export interface LoginResponse {
  success: boolean;
  address?: string;
}

export interface SessionResponse {
  address: string;
  expiresAt: string;
}

export interface AccountResponse {
  account: {
    address: string;
    unlocked: string;
    locked: string;
    marginLocked: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface LogoutResponse {
  success: boolean;
}

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

export class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public originalError?: AxiosError,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

// ============================================================================
// AXIOS INSTANCES
// ============================================================================

/**
 * Public axios instance for unauthenticated endpoints
 * - withCredentials: false (no cookies sent/received)
 * - Used for: nonce endpoint
 */
const publicApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false, // ❌ No credentials
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Authenticated axios instance for endpoints requiring session cookies
 * - withCredentials: true (cookies sent/received)
 * - Used for: login, me, logout, account endpoints
 */
const authenticatedApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // ✅ Include credentials
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================================================
// REQUEST INTERCEPTORS
// ============================================================================

/**
 * Request interceptor for public API
 */
publicApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    logger.info("[authApi:public] 📡 Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      withCredentials: config.withCredentials,
    });
    return config;
  },
  (error: AxiosError) => {
    logger.error(
      "[authApi:public] ❌ Request error:",
      error.message,
    );
    return Promise.reject(error);
  },
);

/**
 * Request interceptor for authenticated API
 */
authenticatedApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    logger.info("[authApi:authenticated] 📡 Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      withCredentials: config.withCredentials,
    });
    return config;
  },
  (error: AxiosError) => {
    logger.error(
      "[authApi:authenticated] ❌ Request error:",
      error.message,
    );
    return Promise.reject(error);
  },
);

// ============================================================================
// RESPONSE INTERCEPTORS
// ============================================================================

/**
 * Response interceptor for public API
 */
publicApi.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.info("[authApi:public] ✅ Response:", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      logger.error("[authApi:public] ❌ Response error:", {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request made but no response (CORS, network, etc.)
      logger.error("[authApi:public] 🌐 Network error:", {
        url: error.config?.url,
        message: error.message,
      });
      logger.info(
        "[authApi:public] 💡 Check CORS configuration and backend connectivity",
      );
    } else {
      // Something else happened
      logger.error("[authApi:public] ❌ Error:", error.message);
    }
    return Promise.reject(error);
  },
);

/**
 * Response interceptor for authenticated API
 */
authenticatedApi.interceptors.response.use(
  (response: AxiosResponse) => {
    logger.info("[authApi:authenticated] ✅ Response:", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error: AxiosError) => {
    // Silently ignore logout errors (session might not exist)
    if (error.config?.url?.includes("/auth/logout")) {
      logger.info(
        "[authApi:authenticated] ℹ️ Logout request (ignoring errors)",
      );
      return Promise.reject(error);
    }

    if (error.response) {
      // Server responded with error status
      logger.error(
        "[authApi:authenticated] ❌ Response error:",
        {
          status: error.response.status,
          url: error.config?.url,
          data: error.response.data,
        },
      );
    } else if (error.request) {
      // Request made but no response (CORS, network, etc.)
      logger.error(
        "[authApi:authenticated] 🌐 Network error:",
        {
          url: error.config?.url,
          message: error.message,
        },
      );
      logger.info(
        "[authApi:authenticated] 💡 Check CORS credentials configuration",
      );
      logger.info(
        "[authApi:authenticated] 💡 Backend should set Access-Control-Allow-Credentials: true",
      );
      logger.info(
        "[authApi:authenticated] 💡 Backend should set Access-Control-Allow-Origin:",
        window.location.origin,
      );
    } else {
      logger.error(
        "[authApi:authenticated] ❌ Error:",
        error.message,
      );
    }
    return Promise.reject(error);
  },
);

// ============================================================================
// ERROR HANDLER UTILITY
// ============================================================================

/**
 * Convert axios error to AuthApiError
 */
function handleApiError(
  error: unknown,
  endpoint: string,
): AuthApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 0;
    const message =
      error.response?.data?.message || error.message;
    return new AuthApiError(
      `API Error: ${message}`,
      status,
      endpoint,
      error,
    );
  }

  if (error instanceof Error) {
    return new AuthApiError(error.message, 0, endpoint);
  }

  return new AuthApiError(
    "Unknown error occurred",
    0,
    endpoint,
  );
}

// ============================================================================
// PUBLIC ENDPOINTS (No Credentials)
// ============================================================================

/**
 * Get nonce from backend
 *
 * PUBLIC ENDPOINT - No credentials needed
 * Called before any authentication exists
 */
export async function getNonce(): Promise<string> {
  const endpoint = "/api/v1/auth/nonce";

  try {
    console.log('🔍 [getNonce] Making request to:', API_BASE_URL + endpoint);
    const response = await publicApi.get<NonceResponse>(endpoint);
    
    console.log('🔍 [getNonce] Raw response:', {
      status: response.status,
      headers: response.headers,
      data: response.data,
      dataType: typeof response.data,
    });
    
    // Validate response structure
    if (!response.data || typeof response.data !== 'object') {
      console.error('❌ [getNonce] Invalid response format:', response.data);
      throw new Error('Invalid nonce response: expected JSON object');
    }
    
    if (!response.data.nonce) {
      console.error('❌ [getNonce] No nonce field in response:', response.data);
      throw new Error('Invalid nonce response: missing nonce field');
    }
    
    if (typeof response.data.nonce !== 'string') {
      console.error('❌ [getNonce] Nonce is not a string:', typeof response.data.nonce, response.data.nonce);
      throw new Error(`Invalid nonce type: expected string, got ${typeof response.data.nonce}`);
    }
    
    console.log('✅ [getNonce] Valid nonce received:', {
      nonce: response.data.nonce,
      expiresAt: response.data.expiresAt,
      nonceLength: response.data.nonce.length,
    });
    
    return response.data.nonce;
  } catch (error) {
    throw handleApiError(error, endpoint);
  }
}

// ============================================================================
// AUTHENTICATED ENDPOINTS (With Credentials)
// ============================================================================

/**
 * Login with signed SIWE message
 *
 * AUTHENTICATED ENDPOINT - Backend sets session cookie
 * Credentials required to receive and store HTTP-only cookie
 */
export async function login(
  request: LoginRequest,
): Promise<LoginResponse> {
  const endpoint = "/api/v1/auth/login";

  try {
    const response = await authenticatedApi.post<LoginResponse>(
      endpoint,
      request,
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error, endpoint);
  }
}

/**
 * Get current session
 *
 * AUTHENTICATED ENDPOINT - Backend reads session cookie
 * Credentials required to send HTTP-only cookie for verification
 */
export async function getSession(): Promise<SessionResponse | null> {
  const endpoint = "/api/v1/auth/me";

  try {
    const response =
      await authenticatedApi.get<SessionResponse>(endpoint);
    logger.info("[authApi] ✅ Active session found", {
      address: response.data.address,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 401/403 means no active session - this is expected
      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        logger.info("[authApi] ℹ️ No active session (401/403)");
        return null;
      }

      // Network error (CORS, backend offline, etc.) - treat as no session
      if (!error.response && error.request) {
        logger.info(
          "[authApi] ℹ️ Backend unavailable (network error) - treating as no session",
        );
        return null;
      }
    }

    // For any other error, log it but don't crash - return null
    logger.warn(
      "[authApi] ⚠️ Session check failed, treating as no session:",
      error,
    );
    return null;
  }
}

/**
 * Logout and clear session
 *
 * AUTHENTICATED ENDPOINT - Backend reads session cookie to clear it
 * Credentials required to send HTTP-only cookie to identify session
 */
export async function logout(): Promise<void> {
  const endpoint = "/api/v1/auth/logout";

  try {
    await authenticatedApi.post<LogoutResponse>(endpoint);
  } catch (error) {
    // Silently fail - logout errors are expected when no session exists
    // The interceptor already handles logging
  }
}

/**
 * Get user account data
 *
 * AUTHENTICATED ENDPOINT - Backend reads session cookie
 * Credentials required to send HTTP-only cookie for user identification
 */
export async function getAccount(): Promise<AccountResponse> {
  const endpoint = "/api/v1/account";

  try {
    const response =
      await authenticatedApi.get<AccountResponse>(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error, endpoint);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const authApi = {
  // Public endpoints
  getNonce,

  // Authenticated endpoints
  login,
  getSession,
  logout,
  getAccount,
};

// Export axios instances for testing/mocking
export const __test__ = {
  publicApi,
  authenticatedApi,
};

export default authApi;