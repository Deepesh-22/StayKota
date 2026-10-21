import { Navigate, useSearchParams } from 'react-router-dom';

/** Keep saved hostels and their management in one place. */
export function FavouritesPage() {
  const [params] = useSearchParams();
  const next = new URLSearchParams({ tab: 'saved' });
  if (params.get('campus')) next.set('campus', params.get('campus')!);
  return <Navigate to={`/dashboard?${next}`} replace />;
}
