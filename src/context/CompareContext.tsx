import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface CompareValue {
  comparisonIds: string[];
  toggleCompare: (id: string) => void;
  isCompared: (id: string) => boolean;
  clearComparison: () => void;
}
const CompareContext = createContext<CompareValue | null>(null);
export function CompareProvider({ children }: { children: ReactNode }) {
  const [comparisonIds, setComparisonIds] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('staykota_compare') || '[]');
      return Array.isArray(saved) ? [...new Set(saved.filter((x): x is string => typeof x === 'string'))].slice(0, 3) : [];
    } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('staykota_compare', JSON.stringify(comparisonIds)); } catch { /* Comparison remains usable in memory. */ } }, [comparisonIds]);
  const toggleCompare = (id: string) => setComparisonIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : ids.length < 3 ? [...ids, id] : ids);
  return <CompareContext.Provider value={{ comparisonIds, toggleCompare, isCompared: id => comparisonIds.includes(id), clearComparison: () => setComparisonIds([]) }}>{children}</CompareContext.Provider>;
}
export function useCompare() {
  const value = useContext(CompareContext);
  if (!value) throw new Error('useCompare must be used within CompareProvider');
  return value;
}
