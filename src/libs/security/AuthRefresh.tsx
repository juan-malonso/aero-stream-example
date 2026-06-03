'use client';

import { useEffect } from 'react';

function shouldRedirectFromUnauthorized(): boolean {
  return window.location.pathname !== '/login' && !window.location.pathname.startsWith('/live/');
}

export function AuthRefresh() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, {
        ...init,
        credentials: init?.credentials ?? 'include',
      });

      if (response.status === 401 && shouldRedirectFromUnauthorized()) {
        window.location.replace('/login');
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
