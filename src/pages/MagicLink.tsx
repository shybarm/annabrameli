import { useSearchParams, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Alias route: /magic redirects to /verify-email (canonical URL)
// This ensures both routes work, with /verify-email being the primary
export default function MagicLink() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const queryString = searchParams.toString();
  
  // URL normalization: fix double slashes if present
  useEffect(() => {
    if (location.pathname.includes('//')) {
      const normalizedPath = location.pathname.replace(/\/+/g, '/');
      window.history.replaceState(null, '', normalizedPath + location.search);
    }
  }, [location]);
  
  // Redirect to /verify-email with the same query params
  return <Navigate to={`/verify-email${queryString ? `?${queryString}` : ''}`} replace />;
}
