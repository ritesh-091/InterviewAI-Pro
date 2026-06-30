const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Enhanced fetch client helper that resolves relative endpoints and attaches JWT tokens automatically.
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle files (e.g. multipart form-data for resume PDFs)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']; // Let the browser set the boundary headers automatically
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Automatically refresh credentials on 401 response status
  if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem('token', refreshData.token);
          localStorage.setItem('refreshToken', refreshData.refreshToken);

          // Update headers and retry request
          headers['Authorization'] = `Bearer ${refreshData.token}`;
          response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      } catch (error) {
        console.error('Auto credential refresh failed:', error);
      }
    }
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong with the request');
  }

  return data;
};
