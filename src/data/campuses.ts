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
  // Illustrative placements for campus discovery; verify names/addresses before real use.
  { id: 'allen-samyak', name: 'Samyak campus', institute: 'ALLEN', area: 'Kunhari', latitude: 25.217, longitude: 75.865, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'allen-sangyan', name: 'Sangyan campus', institute: 'ALLEN', area: 'Kunhari', latitude: 25.218, longitude: 75.862, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'allen-satyarth', name: 'Satyarth campus', institute: 'ALLEN', area: 'Talwandi', latitude: 25.143, longitude: 75.843, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'allen-sankalp', name: 'Sankalp campus', institute: 'ALLEN', area: 'Indra Vihar', latitude: 25.158, longitude: 75.845, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'allen-sakar', name: 'Sakar campus', institute: 'ALLEN', area: 'Jawahar Nagar', latitude: 25.175, longitude: 75.848, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'allen-safalya', name: 'Safalya campus', institute: 'ALLEN', area: 'Landmark', latitude: 25.19, longitude: 75.85, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'allen-supath', name: 'Supath campus', institute: 'ALLEN', area: 'Kunhari', latitude: 25.219, longitude: 75.875, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'allen-sabal', name: 'Sabal campus', institute: 'ALLEN', area: 'Kunhari', latitude: 25.206, longitude: 75.87, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'allen-samanway', name: 'Samanway campus', institute: 'ALLEN', area: 'Jawahar Nagar', latitude: 25.18, longitude: 75.863, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'vibrant-demo', name: 'Kota centre (demo)', institute: 'Vibrant', area: 'Vigyan Nagar', latitude: 25.151, longitude: 75.875, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'pw-demo', name: 'Vidyapeeth centre (demo)', institute: 'PW', area: 'Indra Vihar', latitude: 25.17, longitude: 75.846, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'unacademy-demo', name: 'Kota centre (demo)', institute: 'Unacademy', area: 'Vigyan Nagar', latitude: 25.153, longitude: 75.88, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'aakash-demo', name: 'Kota centre (demo)', institute: 'Aakash', area: 'Indra Vihar', latitude: 25.157, longitude: 75.848, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'bansal-demo', name: 'Kota centre (demo)', institute: 'Bansal', area: 'Vigyan Nagar', latitude: 25.144, longitude: 75.867, sceneX: 50, sceneY: 50, color: '#52796a' },
  { id: 'nucleon-demo', name: 'Kota centre (demo)', institute: 'Nucleon', area: 'Rajeev Gandhi Nagar', latitude: 25.161, longitude: 75.87, sceneX: 50, sceneY: 50, color: '#52796a' },
];
