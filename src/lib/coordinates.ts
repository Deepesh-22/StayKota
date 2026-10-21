/** Coordinates must be complete numbers; never substitute a neighbourhood centre. */
export function validCoordinates(latitude?: number, longitude?: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude!) <= 90 && Math.abs(longitude!) <= 180;
}

/** Broad city envelope used to catch swapped or out-of-city owner submissions. */
export function withinKota(latitude?: number, longitude?: number): boolean {
  return validCoordinates(latitude, longitude) && latitude! >= 25.05 && latitude! <= 25.30
    && longitude! >= 75.70 && longitude! <= 76.02;
}
