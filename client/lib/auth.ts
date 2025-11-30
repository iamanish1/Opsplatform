/**
 * Get auth token from localStorage (client-side only)
 * Note: For server-side token access, use server actions or API routes
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    // Server-side: cannot access localStorage
    // Token should be passed via headers or server actions
    return null;
  }
  // Client-side: get from localStorage
  return localStorage.getItem('auth_token');
}

/**
 * Set auth token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Remove auth token
 */
export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

