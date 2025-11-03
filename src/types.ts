export interface Earthquake {
  id: string;
  place: string;
  magnitude: number;
  depth: number;
  lat: number;
  lng: number;
  time: number; // epoch ms
  // Extended fields from USGS CSV (optional where not present)
  magType?: string;
  type?: string;
  nst?: number; // Number of seismic stations
  gap?: number; // Azimuthal gap
  dmin?: number; // Horizontal distance to the nearest station
  rms?: number; // Root mean square of travel time residuals
  horizontalError?: number;
  depthError?: number;
  magError?: number;
  magNst?: number; // Number of stations for magnitude
}
