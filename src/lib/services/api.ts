/**
 * API service — Base HTTP client with JWT injection.
 */
import { get } from 'svelte/store';
import { token } from '$lib/stores/auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getHeaders(custom?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...custom,
  };

  const jwt = get(token);
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  return headers;
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      data
    );
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ── Public API ──

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  const url = buildUrl(path, options?.params);
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(options?.headers),
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  const url = buildUrl(path, options?.params);
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(options?.headers),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  const url = buildUrl(path, options?.params);
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(options?.headers),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  const url = buildUrl(path, options?.params);
  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(options?.headers),
  });
  return handleResponse<T>(response);
}

export { ApiError };
