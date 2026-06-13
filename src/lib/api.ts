/**
 * Returns the API base URL.
 * Prefers the env variable, falls back to empty string (relative URL for same-origin).
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
