export interface Earthquake {
  id: string;
  place: string;
  magnitude: number;
  depth: number;
  lat: number;
  lng: number;
  time: number; // epoch ms
}
