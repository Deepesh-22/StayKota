/** Illustrative campus pins for the frontend demo, not surveyed locations. */
export interface Campus {
  id: string;
  name: string;
  institute: string;
  area: string;
  latitude: number;
  longitude: number;
  sceneX: number;
  sceneY: number;
  color: string;
}

export const DEFAULT_CAMPUS_ID = 'allen-landmark';
export const CAMPUSES: Campus[] = [
  { id: 'allen-landmark', name: 'Landmark campus', institute: 'ALLEN', area: 'Landmark', latitude: 25.213, longitude: 75.858, sceneX: 58, sceneY: 34, color: '#0c7667' },
  { id: 'allen-talwandi', name: 'Talwandi campus', institute: 'ALLEN', area: 'Talwandi', latitude: 25.146, longitude: 75.852, sceneX: 35, sceneY: 62, color: '#b56d4d' },
  { id: 'resonance-vigyan', name: 'Vigyan Nagar campus', institute: 'Resonance', area: 'Rajeev Gandhi Nagar', latitude: 25.152, longitude: 75.864, sceneX: 73, sceneY: 60, color: '#927641' },
  { id: 'motion-rajiv', name: 'Rajeev Gandhi Nagar campus', institute: 'Motion', area: 'Rajeev Gandhi Nagar', latitude: 25.16, longitude: 75.858, sceneX: 57, sceneY: 78, color: '#52796a' },
];
