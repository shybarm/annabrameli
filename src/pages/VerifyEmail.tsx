import { useSearchParams, Navigate } from 'react-router-dom';

// Redirect /verify-email to /magic preserving query string
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const queryString = searchParams.toString();
  
  // Redirect to /magic with the same query params
  return <Navigate to={`/magic${queryString ? `?${queryString}` : ''}`} replace />;
}
