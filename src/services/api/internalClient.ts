/**
 * Internal API Client Configuration
 *
 * Axios instance for internal Bitfrost backend API calls.
 * Uses HTTP-only cookies for authentication.
 * Base URL switches between testnet/mainnet based on VITE_NETWORK env variable.
 *
 * Usage:
 *   import { internalApiClient } from './services/api/internalClient';
 *   const response = await internalApiClient.get('/portfolio/summary');
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import type { ApiResponse, ApiError } from "../../types";
import { API_BASE_URL, API_TIMEOUT } from "../../constants/app";
import { logger } from "../../utils/logger";

// ============================================================================
// CREATE AXIOS INSTANCE
// ============================================================================

export const internalApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable HTTP-only cookies
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

internalApiClient.interceptors.request.use(
  (config) => {
    // Add request timestamp
    config.headers["X-Request-Time"] = Date.now().toString();

    // Add wallet address if available (for additional context)
    const walletAddress = getWalletAddress();
    if (walletAddress) {
      config.headers["X-Wallet-Address"] = walletAddress;
    }

    // Log request in development
    logger.apiRequest(
      config.method || "GET",
      config.url || "",
      config.data,
    );

    return config;
  },
  (error) => {
    logger.error("Internal API Request Error", error);
    return Promise.reject(error);
  },
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

internalApiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    // Log response in development
    logger.apiResponse(
      response.config.url || "",
      response.data,
    );

    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Extract error details
    const originalRequest =
      error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const errorData = error.response?.data;

    // Log error in development
    logger.error("Internal API Error", error, {
      url: originalRequest?.url,
      status,
      errorData,
    });

    // Handle specific error cases
    switch (status) {
      case 401:
        // Unauthorized - session expired or invalid
        if (!originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh session
          const sessionRefreshed = await refreshSession();
          if (sessionRefreshed) {
            return internalApiClient(originalRequest);
          }

          // If refresh fails, handle unauthorized
          handleUnauthorized();
        }
        break;

      case 403:
        // Forbidden - user doesn't have permission
        handleForbidden();
        break;

      case 429:
        // Rate limited - retry after delay
        const retryAfter =
          error.response?.headers["retry-after"];
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : 5000;

        await new Promise((resolve) =>
          setTimeout(resolve, delay),
        );
        return internalApiClient(originalRequest);

      case 500:
      case 502:
      case 503:
        // Server errors - show user-friendly message
        handleServerError();
        break;

      default:
        // Generic error handling
        handleGenericError(errorData);
    }

    return Promise.reject(error);
  },
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get wallet address from localStorage
 */
function getWalletAddress(): string | null {
  try {
    return localStorage.getItem("bitfrost_last_wallet_address");
  } catch {
    return null;
  }
}

/**
 * Refresh session using HTTP-only cookies
 */
async function refreshSession(): Promise<boolean> {
  try {
    // Call refresh endpoint - cookies are sent automatically
    await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      {
        withCredentials: true,
      },
    );

    return true;
  } catch (error) {
    logger.error("Session refresh failed", error);
    return false;
  }
}

/**
 * Handle 401 Unauthorized errors
 */
function handleUnauthorized(): void {
  // Clear local auth data
  localStorage.removeItem("bitfrost_last_wallet_address");

  // Dispatch logout event
  window.dispatchEvent(new CustomEvent("auth:logout"));
}

/**
 * Handle 403 Forbidden errors
 */
function handleForbidden(): void {
  logger.error("Access forbidden - insufficient permissions");
  // TODO: Show toast notification
}

/**
 * Handle 5xx Server errors
 */
function handleServerError(): void {
  logger.error("Server error - please try again later");
  // TODO: Show toast notification
}

/**
 * Handle generic API errors
 */
function handleGenericError(error?: ApiError): void {
  const message =
    error?.error?.message || "An unexpected error occurred";
  logger.error("Internal API Error", new Error(message), {
    errorData: error,
  });
  // TODO: Show toast notification
}

// ============================================================================
// TYPED REQUEST HELPERS
// ============================================================================

/**
 * Typed GET request
 */
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await internalApiClient.get<ApiResponse<T>>(
    url,
    config,
  );
  return response.data.data;
}

/**
 * Typed POST request
 */
export async function post<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await internalApiClient.post<ApiResponse<T>>(
    url,
    data,
    config,
  );
  return response.data.data;
}

/**
 * Typed PUT request
 */
export async function put<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await internalApiClient.put<ApiResponse<T>>(
    url,
    data,
    config,
  );
  return response.data.data;
}

/**
 * Typed DELETE request
 */
export async function del<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await internalApiClient.delete<
    ApiResponse<T>
  >(url, config);
  return response.data.data;
}

/**
 * Typed PATCH request
 */
export async function patch<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await internalApiClient.patch<
    ApiResponse<T>
  >(url, data, config);
  return response.data.data;
}

// ============================================================================
// AUTH API METHODS
// ============================================================================

/**
 * Login request with wallet address
 * Sets HTTP-only cookie on success
 *
 * @param walletAddress - Connected wallet address
 * @returns User information
 */
export async function login(
  walletAddress: string,
): Promise<{ user_deposited: boolean }> {
  try {
    const response = await post<{ user_deposited: boolean }>(
      "/api/v1/auth/login",
      {
        wallet_address: walletAddress,
      },
    );

    // Store wallet address for future requests
    localStorage.setItem(
      "bitfrost_last_wallet_address",
      walletAddress,
    );

    logger.info("Login successful", { walletAddress });
    return response;
  } catch (error) {
    logger.error("Login failed", error);
    throw error;
  }
}

/**
 * Logout request
 * Clears HTTP-only cookie on server
 */
export async function logout(): Promise<void> {
  try {
    await post("/api/v1/auth/logout");

    // Clear local storage
    localStorage.removeItem("bitfrost_last_wallet_address");

    logger.info("Logout successful");
  } catch (error) {
    logger.error("Logout failed", error);
    // Even if logout fails on server, clear local data
    localStorage.removeItem("bitfrost_last_wallet_address");
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default internalApiClient;