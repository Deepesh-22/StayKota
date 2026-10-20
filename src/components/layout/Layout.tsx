import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useApp } from '../../context/AppContext';
export function Layout() {
  const { storageError } = useApp();
  return <div className="min-h-screen flex flex-col"><a className="sk-skip-link" href="#main-content">Skip to content</a><Navbar/>{storageError && <div className="sk-storage-warning" role="status">Your browser cannot save changes right now. This preview will still work, but changes may be lost on refresh.</div>}<main id="main-content" className="flex-1" tabIndex={-1}><Outlet/></main><Footer/></div>;
}
