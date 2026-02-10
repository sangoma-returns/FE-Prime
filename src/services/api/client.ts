/**
 * API Client Configuration
 * 
 * Central Axios instance for API calls.
 * Authentication is handled via HTTP-only cookies (see /lib/authApi.ts)
 * 
 * Usage:
 *   import { get, post } from './services/api/client';
 *   const data = await get('/portfolio/summary');
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse, ApiError } from '../../types';
import { API_BASE_URL, API_TIMEOUT } from '../../constants/app';
import { logger } from '../../utils/logger';

// ============================================================================
// CREATE AXIOS INSTANCE
// ============================================================================

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // ✅ Send HTTP-only cookies with every request
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

apiClient.interceptors.request.use(
  (config) => {
    // Add request timestamp
    config.headers['X-Request-Time'] = Date.now().toString();

    // Log request in development
    logger.apiRequest(config.method || 'GET', config.url || '', config.data);

    return config;
  },
  (error) => {
    logger.error('API Request Error', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    // Log response in development
    logger.apiResponse(response.config.url || '', response.data);

    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Extract error details
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorData = error.response?.data;

    // Log error in development
    logger.error('API Error', error, {
      url: originalRequest?.url,
      status,
      errorData,
    });

    // Handle specific error cases
    switch (status) {
      case 401:
        // Unauthorized - session expired or invalid
        // Auth is handled by authApi.ts and useSessionRestore hook
        logger.info('[apiClient] 401 Unauthorized - session invalid');
        break;

      case 403:
        // Forbidden - user doesn't have permission
        logger.error('[apiClient] 403 Forbidden - insufficient permissions');
        break;

      case 429:
        // Rate limited - retry after delay
        const retryAfter = error.response?.headers['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        
        logger.warn('[apiClient] 429 Rate Limited - retrying after ' + delay + 'ms');
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(originalRequest!);

      case 500:
      case 502:
      case 503:
        // Server errors
        logger.error('[apiClient] Server error (' + status + ')');
        break;

      default:
        // Generic error handling
        const message = errorData?.error?.message || 'An unexpected error occurred';
        logger.error('[apiClient] Error:', message);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// TYPED REQUEST HELPERS
// ============================================================================

/**
 * Typed GET request
 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return response.data.data;
}

/**
 * Typed POST request
 */
export async function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  return response.data.data;
}

/**
 * Typed PUT request
 */
export async function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, data, config);
  return response.data.data;
}

/**
 * Typed DELETE request
 */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return response.data.data;
}

/**
 * Typed PATCH request
 */
export async function patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
  return response.data.data;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default apiClient;
