import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { CompareProvider } from './context/CompareContext';
import { HostelTransitionProvider } from './context/HostelTransitionContext';
import { Layout } from './components/layout/Layout';
import { RequireHostelLogin } from './components/auth/RequireHostelLogin';
import { HomePage } from './pages/HomePage';
const ExplorePage = lazy(() => import('./pages/ExplorePage').then(module => ({ default: module.ExplorePage })));
const HostelPreviewPage = lazy(() => import('./pages/HostelPreviewPage').then(module => ({ default: module.HostelPreviewPage })));
const HostelDetailPage = lazy(() => import('./pages/HostelDetailPage').then(module => ({ default: module.HostelDetailPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const FavouritesPage = lazy(() => import('./pages/FavouritesPage').then(module => ({ default: module.FavouritesPage })));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard').then(module => ({ default: module.StudentDashboard })));
const VisitsPage = lazy(() => import('./pages/VisitsPage').then(module => ({ default: module.VisitsPage })));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard').then(module => ({ default: module.OwnerDashboard })));
const ListingWizardPage = lazy(() => import('./pages/ListingWizardPage').then(module => ({ default: module.ListingWizardPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage').then(module => ({ default: module.HowItWorksPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })));
const ComparePage = lazy(() => import('./pages/ComparePage').then(module => ({ default: module.ComparePage })));
const KotaMapPage = lazy(() => import('./pages/KotaMapPage').then(module => ({ default: module.KotaMapPage })));

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const labels: Record<string, string> = { '/': 'Your Kota starts here', '/explore': 'Find your stay', '/compare': 'Compare your shortlist', '/login': 'Your student journey', '/dashboard': 'Your student space', '/owner': 'Owner workspace', '/admin': 'Listing moderation', '/how-it-works': 'How it works' };
    document.title = `${(pathname === '/map' ? 'Explore the whole of Kota' : labels[pathname]) || (pathname.startsWith('/hostel/') ? pathname.endsWith('/preview') ? 'Hostel preview' : 'Room details' : pathname.startsWith('/owner/listing/') ? 'Listing editor' : 'Find your way')} · StayKota`;
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <CompareProvider>
      <BrowserRouter>
        <HostelTransitionProvider>
        <RouteEffects />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/map" element={<KotaMapPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/hostel/:id/preview" element={<HostelPreviewPage />} />
            <Route element={<RequireHostelLogin />}><Route path="/hostel/:id" element={<HostelDetailPage />} /></Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/favourites" element={<FavouritesPage />} />
            <Route path="/visits" element={<VisitsPage />} />
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/owner/listing/new" element={<ListingWizardPage />} />
            <Route path="/owner/listing/:id/edit" element={<ListingWizardPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        </HostelTransitionProvider>
      </BrowserRouter>
      </CompareProvider>
    </AppProvider>
  );
}
