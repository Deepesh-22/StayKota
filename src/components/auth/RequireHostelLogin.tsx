import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { hostelLoginHref } from '../../lib/hostel-navigation';

/** UI access guard. Real authorization must also be enforced by the future backend. */
export function RequireHostelLogin() {
  const { user, hostels } = useApp();
  const { id } = useParams();
  const location = useLocation();
  const published = hostels.some(hostel => hostel.id === id && hostel.status === 'approved');
  // Unknown/unpublished listings retain the existing not-found page for everyone.
  if (published && (!user || user.role === 'visitor')) return <Navigate to={hostelLoginHref(location.pathname + location.search + location.hash)} replace/>;
  return <Outlet/>;
}
