import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Navbar } from './components/layout/Navbar';
import { IndexPlaygroundView } from './components/playground/IndexPlaygroundView';
import { IndexComparisonView } from './components/comparison/IndexComparisonView';
import { MaterializedViewPage } from './components/materializedview/MaterializedViewPage';
import { PerformanceLabView } from './components/perflab/PerformanceLabView';
import { SqlExplorerView } from './components/sqlexplorer/SqlExplorerView';

function AnimatedAppRoutes() {
  const location = useLocation();
  const rootKey = location.pathname.split('/')[1] || 'playground';

  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-[14px] focus:shadow-lift"
      >
        Lewati ke konten utama
      </a>
      <Navbar />

      <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-3.5 sm:px-8 pb-16 sm:pb-20 pt-5 sm:pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={rootKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/playground/btree" replace />} />
              <Route path="/playground" element={<IndexPlaygroundView />} />
              <Route path="/playground/:indexId" element={<IndexPlaygroundView />} />
              <Route path="/comparison" element={<IndexComparisonView />} />
              <Route path="/bandingkan" element={<Navigate to="/comparison" replace />} />
              <Route path="/materialized-view" element={<MaterializedViewPage />} />
              <Route path="/materializedview" element={<Navigate to="/materialized-view" replace />} />
              <Route path="/performance" element={<PerformanceLabView />} />
              <Route path="/performa" element={<Navigate to="/performance" replace />} />
              <Route path="/sql" element={<SqlExplorerView />} />
              <Route path="*" element={<Navigate to="/playground/btree" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-line-soft bg-white/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2 px-5 py-6 text-[12.5px] text-ink-2 sm:px-8">
          <span>Seluruh angka performa adalah simulasi edukatif.</span>
        </div>
      </footer>
    </div>
  );
}

// Auto-migrate legacy hash URLs (e.g. /#/playground/btree -> /playground/btree)
if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
  const cleanPath = window.location.hash.slice(1);
  window.history.replaceState(null, '', cleanPath);
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AnimatedAppRoutes />
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
