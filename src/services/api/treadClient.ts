/**
 * Tread.fi API Client Configuration
 * 
 * Axios instance for Tread.fi external API calls.
 * Uses separate authentication and base URL from internal API.
 * 
 * Usage:
 *   import { treadApiClient } from './services/api/treadClient';
 *   const response = await treadApiClient.get('/funding-rates');
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../../utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TREAD_API_BASE_URL = import.meta.env.VITE_TREAD_API_BASE_URL || 'https://api.tread.fi';
const TREAD_API_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// CREATE AXIOS INSTANCE
// ============================================================================

export const treadApiClient: AxiosInstance = axios.create({
  baseURL: TREAD_API_BASE_URL,
  timeout: TREAD_API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

treadApiClient.interceptors.request.use(
  (config) => {
    // Add API key if available
    const apiKey = getTreadApiKey();
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }

    // Add request timestamp
    config.headers['X-Request-Time'] = Date.now().toString();

    // Log request in development
    logger.apiRequest(config.method || 'GET', config.url || '', config.data);

    return config;
  },
  (error) => {
    logger.error('Tread API Request Error', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

treadApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    logger.apiResponse(response.config.url || '', response.data);

    return response;
  },
  async (error: AxiosError) => {
    // Extract error details
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const errorData = error.response?.data;

    // Log error in development
    logger.error('Tread API Error', error, {
      url: originalRequest?.url,
      status,
      errorData,
    });

    // Handle specific error cases
    switch (status) {
      case 401:
        // Unauthorized - invalid API key
        handleUnauthorized();
        break;

      case 403:
        // Forbidden - API key doesn't have permission
        handleForbidden();
        break;

      case 429:
        // Rate limited - retry after delay
        const retryAfter = error.response?.headers['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return treadApiClient(originalRequest);

      case 500:
      case 502:
      case 503:
        // Server errors
        handleServerError();
        break;

      default:
        // Generic error handling
        handleGenericError(errorData);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Tread.fi API key from environment or localStorage
 */
function getTreadApiKey(): string | null {
  // First try environment variable
  const envKey = import.meta.env.VITE_TREAD_API_KEY;
  if (envKey) return envKey;

  // Fallback to localStorage (if user provides their own key)
  try {
    return localStorage.getItem('tread_api_key');
  } catch {
    return null;
  }
}

/**
 * Set Tread.fi API key in localStorage
 */
export function setTreadApiKey(apiKey: string): void {
  localStorage.setItem('tread_api_key', apiKey);
}

/**
 * Remove Tread.fi API key from localStorage
 */
export function clearTreadApiKey(): void {
  localStorage.removeItem('tread_api_key');
}

/**
 * Handle 401 Unauthorized errors
 */
function handleUnauthorized(): void {
  logger.error('Tread API - Invalid or missing API key');
  // TODO: Show toast notification
}

/**
 * Handle 403 Forbidden errors
 */
function handleForbidden(): void {
  logger.error('Tread API - Access forbidden');
  // TODO: Show toast notification
}

/**
 * Handle 5xx Server errors
 */
function handleServerError(): void {
  logger.error('Tread API - Server error');
  // TODO: Show toast notification
}

/**
 * Handle generic API errors
 */
function handleGenericError(error?: any): void {
  const message = error?.message || 'An unexpected error occurred with Tread API';
  logger.error('Tread API Error', new Error(message), { errorData: error });
  // TODO: Show toast notification
}

// ============================================================================
// TYPED REQUEST HELPERS
// ============================================================================

/**
 * Typed GET request
 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await treadApiClient.get<T>(url, config);
  return response.data;
}

/**
 * Typed POST request
 */
export async function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await treadApiClient.post<T>(url, data, config);
  return response.data;
}

/**
 * Typed PUT request
 */
export async function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await treadApiClient.put<T>(url, data, config);
  return response.data;
}

/**
 * Typed DELETE request
 */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await treadApiClient.delete<T>(url, config);
  return response.data;
}

/**
 * Typed PATCH request
 */
export async function patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await treadApiClient.patch<T>(url, data, config);
  return response.data;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default treadApiClient;
