import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
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

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
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
    </AppProvider>
  );
}
