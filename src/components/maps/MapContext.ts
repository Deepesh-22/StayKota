import { createContext, useContext } from 'react';
import type { Map } from 'maplibre-gl';
export const CityMapContext = createContext<Map | null>(null);
export function useCityMap() { return useContext(CityMapContext); }
