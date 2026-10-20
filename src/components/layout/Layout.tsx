import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useApp } from '../../context/AppContext';
export function Layout() {
  const { storageError } = useApp();
  const isCityMap = useLocation().pathname === '/map';
  return <div className={`min-h-screen flex flex-col${isCityMap ? ' sk-layout--map' : ''}`}><a className="sk-skip-link" href="#main-content">Skip to content</a><Navbar/>{storageError && <div className="sk-storage-warning" role="status">Your browser cannot save changes right now. This preview will still work, but changes may be lost on refresh.</div>}<main id="main-content" className="flex-1" tabIndex={-1}><Outlet/></main>{!isCityMap && <Footer/>}</div>;
}
