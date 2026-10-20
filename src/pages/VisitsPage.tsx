import { Navigate, useSearchParams } from 'react-router-dom';

/** Legacy public URL; the student dashboard is the single source for visit management. */
export function VisitsPage() {
  const [params] = useSearchParams();
  const next = new URLSearchParams({ tab: 'visits' });
  if (params.get('campus')) next.set('campus', params.get('campus')!);
  return <Navigate to={`/dashboard?${next}`} replace />;
}
