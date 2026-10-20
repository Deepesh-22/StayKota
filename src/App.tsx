import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { CompareProvider } from './context/CompareContext';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { HostelDetailPage } from './pages/HostelDetailPage';
import { LoginPage } from './pages/LoginPage';
import { FavouritesPage } from './pages/FavouritesPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { VisitsPage } from './pages/VisitsPage';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { ListingWizardPage } from './pages/ListingWizardPage';
import { AdminPage } from './pages/AdminPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ComparePage } from './pages/ComparePage';

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const labels: Record<string, string> = { '/': 'Your Kota starts here', '/explore': 'Find your stay', '/compare': 'Compare your shortlist', '/login': 'Your student journey', '/dashboard': 'Your student space', '/owner': 'Owner workspace', '/admin': 'Listing moderation', '/how-it-works': 'How it works' };
    document.title = `${labels[pathname] || (pathname.startsWith('/hostel/') ? 'Room details' : pathname.startsWith('/owner/listing/') ? 'Listing editor' : 'Find your way')} · StayKota`;
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <CompareProvider>
      <BrowserRouter>
        <RouteEffects />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/hostel/:id" element={<HostelDetailPage />} />
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
      </BrowserRouter>
      </CompareProvider>
    </AppProvider>
  );
}
