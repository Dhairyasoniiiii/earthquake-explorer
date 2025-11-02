import { create } from "zustand";

export interface Earthquake {
  id: string;
  place: string;
  magnitude: number;
  depth: number;
  lat: number;
  lon: number;
  time: number;
}

interface EarthquakeStore {
  earthquakes: Earthquake[];
  selectedEarthquake?: Earthquake;
  setEarthquakes: (data: Earthquake[]) => void;
  selectEarthquake: (eq?: Earthquake) => void;
}

export const useEarthquakeStore = create<EarthquakeStore>((set: (fn: any) => void) => ({
  earthquakes: [],
  selectedEarthquake: undefined,
  setEarthquakes: (data: Earthquake[]) => set(() => ({ earthquakes: data })),
  selectEarthquake: (eq?: Earthquake) => set(() => ({ selectedEarthquake: eq })),
}));
