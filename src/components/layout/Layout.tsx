import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PageBoundary } from './PageBoundary';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useApp } from '../../context/AppContext';

export function Layout() {
  const { storageError } = useApp();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const isCityMap = pathname === '/map';
  const [scrollRatio, setScrollRatio] = useState(0);

  useEffect(() => {
    if (isHome || isCityMap) {
      setScrollRatio(0);
      return;
    }
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScrollRatio(max > 80 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname, isHome, isCityMap]);

  return (
    <div className={`min-h-screen flex flex-col${isCityMap ? ' sk-layout--map' : ''}`}>
      {!isHome && !isCityMap && (
        <div
          className="sk-scroll-progress"
          aria-hidden="true"
          style={{ transform: `scaleX(${scrollRatio.toFixed(4)})` }}
        />
      )}
      <a className="sk-skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      {storageError && (
        <div className="sk-storage-warning" role="status">
          Your browser cannot save changes right now. This preview will still work, but changes may be lost on refresh.
        </div>
      )}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <PageBoundary key={pathname}>
          <Outlet />
        </PageBoundary>
      </main>
      {!isCityMap && <Footer />}
    </div>
  );
}
