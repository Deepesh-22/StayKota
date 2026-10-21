import { minimumKotaZoom } from '../src/lib/map-area';
import { expect, test, type Page } from '@playwright/test';

async function sampleStudent(page: Page) {
  await page.goto('/login?role=student');
  await page.getByRole('button', { name: 'Use sample student account' }).click();
  await expect(page).toHaveURL(/\/dashboard|\/$/);
}

test('campus search carries preferences and matches an actual room', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your Kota/ })).toBeVisible();
  await page.getByLabel('My coaching campus').selectOption('allen-talwandi');
  await page.getByLabel('Monthly budget', { exact: true }).selectOption('8000');
  await page.getByLabel('My kind of room').selectOption('double');
  await page.getByRole('button', { name: 'Find my stay', exact: true }).click();
  await expect(page).toHaveURL(/campus=allen-talwandi/);
  await expect(page).toHaveURL(/sharing=double/);
  await expect(page.getByRole('heading', { name: /Rooms near/ })).toBeVisible();
  await expect(page.locator('.discovery-grid article').first()).toContainText('Double sharing');
  await page.goto('/explore?sharing=single&maxBudget=6000');
  await expect(page.getByText('Your next room is still out there.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset my filters' }).click();
  await expect(page.locator('.discovery-grid article')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('comparison carries matching room criteria and shared URLs work without local state', async ({ page }) => {
  await page.goto('/explore?campus=allen-talwandi&sharing=double&maxBudget=8000');
  await page.getByRole('button', { name: /Add .* to comparison/ }).nth(0).click();
  await page.getByRole('button', { name: /Add .* to comparison/ }).nth(0).click();
  await page.locator('.discovery-compare-link').click();
  await expect(page).toHaveURL(/\/compare\?.*sharing=double/);
  await expect(page.locator('thead th')).toHaveCount(3);
  await expect(page.locator('.compare-property select').first()).toHaveValue(/rt/);
  await page.goto('/compare?ids=h1,h4&sharing=double&campus=allen-talwandi');
  await expect(page.locator('thead th')).toHaveCount(3);
  await expect(page.getByLabel('Room at Kota Living PG')).toHaveValue('');
  await page.getByLabel('Room at Kota Living PG').selectOption('rt8');
  await expect(page).toHaveURL(/room_h4=rt8/);
  await expect(page.locator('tbody tr').first()).toContainText('₹9,500');
});

test('visit requires consent, persists as requested and survives reload', async ({ page }) => {
  await sampleStudent(page);
  await page.goto('/hostel/h1?campus=allen-talwandi&room=rt2');
  await page.locator('.detail-sidebar').getByRole('button', { name: 'Request a visit' }).click();
  const form = page.getByRole('dialog');
  const d = new Date(); d.setDate(d.getDate() + 2);
  const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  await page.getByLabel('Preferred visit date').fill(date);
  await page.getByLabel('Mobile number', { exact: true }).fill('9876543210');
  await form.getByRole('button', { name: 'Save visit request' }).click();
  await expect(form.getByRole('alert')).toContainText('agree');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Save visit request' }).click();
  await expect(form.getByRole('heading', { name: 'Request saved.' })).toBeVisible();
  await expect(form).toContainText('No owner has been notified');
  await page.reload();
  const visits = await page.evaluate(() => JSON.parse(localStorage.getItem('staykota_visits') || '[]'));
  expect(visits).toHaveLength(1); expect(visits[0]).toMatchObject({ status: 'requested', roomTypeId: 'rt2' });
  expect(visits[0].consentAt).toBeTruthy();
  await page.goto('/dashboard?tab=visits');
  await expect(page.locator('main')).toContainText('Comfort Stay');
  await expect(page.locator('main')).toContainText('Coordination pending');
});

test('unapproved listings stay private and missing pages recover', async ({ page }) => {
  await page.goto('/hostel/h5');
  await expect(page.getByRole('heading', { name: 'This stay isn’t on the map.' })).toBeVisible();
  await page.goto('/not-a-real-page');
  await expect(page.locator('main')).toContainText('404');
  await expect(page.getByRole('link', { name: /Explore hostels/ }).last()).toBeVisible();
});

test('mobile navigation, map and dialogs work without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.locator('#mobile-navigation').getByRole('link', { name: 'Explore hostels', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Rooms near/ })).toBeVisible();
  await page.getByRole('button', { name: /Map view/i }).click();
  await expect(page.locator('.discovery-results-map')).toBeVisible();
  await page.getByRole('button', { name: /List view/i }).click();
  await page.getByRole('button', { name: /All filters/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const widths = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(widths.actual).toBeLessThanOrEqual(widths.viewport);
});

test('reduced motion and image gallery remain functional', async ({ page }) => {
  await sampleStudent(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/hostel/h1?room=rt2');
  await page.getByRole('button', { name: 'Open hostel photo gallery' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Next photo' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

// The real MapLibre renderer runs with a minimal local style fixture; no live basemap is claimed.
async function stubOpenMapStyle(page: Page) {
  await page.route('https://tiles.openfreemap.org/styles/liberty', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({
    version: 8, name: 'TEST FIXTURE — no live basemap', sources: {},
    layers: [{ id: 'test-background', type: 'background', paint: { 'background-color': '#e8eddf' } }],
  }) }));
}

test('keyless MapLibre map renders real demo pins, attribution and 2D/3D controls', async ({ page }) => {
  const googleRequests: string[] = [];
  page.on('request', request => { if (/googleapis|google.com\/maps/.test(request.url())) googleRequests.push(request.url()); });
  await stubOpenMapStyle(page);
  await page.goto('/map');
  await expect(page.getByRole('heading', { name: 'Explore Kota', exact: true })).toBeVisible();
  await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  expect((await page.getByRole('region', { name: 'Interactive OpenStreetMap of Kota', exact: true }).boundingBox())!.height).toBeGreaterThan(200);
  await expect(page.locator('.student-pin-group').first()).toBeVisible();
  await expect(page.locator('.maplibregl-ctrl-attrib')).toBeVisible();
  await expect(page.getByRole('button', { name: '3D tilt', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '3D tilt', exact: true }).click();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-perspective', '3d');
  const compass = page.locator('.maplibregl-ctrl-compass .maplibregl-ctrl-icon');
  await expect(compass).toHaveAttribute('style', /rotateX\(50deg\)/);
  await page.getByLabel('Centre map on a coaching campus').selectOption('allen-talwandi');
  await expect(compass).toHaveAttribute('style', /rotateX\(50deg\)/);
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-perspective', '2d');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Satellite', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(googleRequests).toEqual([]);
});

test('groups expand, hostel pins open previews and coaching selection centres the map', async ({ page }) => {
  await stubOpenMapStyle(page);
  await page.goto('/map');
  await expect(page.locator('.student-pin-group').first()).toBeVisible();
  const before = await page.locator('.maplibregl-marker').count();
  await page.locator('.student-pin-group').first().click();
  await expect.poll(() => page.locator('.maplibregl-marker').count()).toBeGreaterThan(before);
  await page.getByLabel('Centre map on a coaching campus').selectOption('allen-talwandi');
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-target', '25.146,75.852');
  await page.locator('.maplibregl-ctrl-zoom-in').click();
  await page.locator('.maplibregl-ctrl-zoom-in').click();
  await page.getByRole('button', { name: 'Select Comfort Stay Hostel on map', exact: true }).click();
  await expect(page).toHaveURL(/hostel\/h1\/preview/);
  await expect(page.getByRole('heading',{name:'Comfort Stay Hostel',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Back to Kota map',exact:true}).click();
  await expect(page.locator('.student-hostel-pin.is-selected')).toBeVisible();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-target', '25.148,75.852');
  await page.getByRole('button', { name: 'Clear selected hostel', exact: true }).click();
  await expect(page).not.toHaveURL(/hostel=h1/);
  await expect(page).toHaveURL(/campus=allen-talwandi/);
  await page.getByRole('button', { name: 'Whole Kota', exact: true }).click();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-target', '25.183,75.839');
});

test('room and coaching-radius filters preserve matching available demo inventory', async ({ page }) => {
  await stubOpenMapStyle(page);
  await page.goto('/map?sharing=single&budget=5000&hostel=h5');
  await expect(page.locator('.city-stay')).toHaveCount(0);
  await expect(page.locator('.city-selected')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset room filters' }).click();
  await expect(page.locator('.city-stay')).toHaveCount(7);
  await page.getByLabel('Centre map on a coaching campus').selectOption('allen-talwandi');
  await page.getByLabel('Distance from coaching', { exact: true }).selectOption('1');
  await expect(page.locator('.city-stays')).toContainText('Comfort Stay');
  await expect(page.locator('.city-stays')).not.toContainText('Scholar');
  await page.getByLabel('Centre map on a coaching campus').selectOption('allen-landmark');
  await expect(page.locator('.city-stay')).toHaveCount(1);
});

test('mobile map and location control fit the viewport and hostel panel restores focus', async ({ page }) => {
  await stubOpenMapStyle(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/map');
  await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use my current location on map', exact: true })).toBeVisible();
  const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, height: document.documentElement.scrollHeight, window: innerHeight }));
  expect(size.width).toBeLessThanOrEqual(size.viewport);
  expect(size.height).toBeLessThanOrEqual(size.window + 1);
  await page.getByRole('button', { name: /Stays \(/ }).click();
  await expect(page.getByRole('dialog', { name: 'Hostel filters and sample stays' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Stays \(/ })).toBeFocused();
});

test('failed tile service shows an honest retry state while manual hostel search works', async ({ page }) => {
  let requests = 0;
  await page.route('https://tiles.openfreemap.org/styles/liberty', route => { requests++; return route.fulfill({ status: 503, body: 'Test service failure' }); });
  await page.goto('/map');
  await expect(page.getByRole('alert')).toContainText('map could not load');
  await expect(page.locator('.city-stay')).toHaveCount(7);
  const before = requests;
  await page.getByRole('button', { name: 'Retry map', exact: true }).click();
  await expect.poll(() => requests).toBeGreaterThan(before);
  await page.getByRole('button', { name: 'Show Comfort Stay Hostel on map' }).click();
  await expect(page.locator('.city-stay.is-selected')).toContainText('Comfort Stay');
});

// Browser location is simulated here; these tests never request a student's real location.
async function mockLiveLocation(page: Page, errorCode = 0) {
  await page.addInitScript(({ errorCode }) => {
    let success: PositionCallback;
    let failure: PositionErrorCallback | null = null;
    let active = false;
    const mock = {
      starts: 0, stops: 0,
      move(latitude: number, longitude: number) {
        if (active) success({ coords: { latitude, longitude, accuracy: 20 } } as GeolocationPosition);
      },
      late() { success?.({ coords: { latitude: 28.61, longitude: 77.2, accuracy: 20 } } as GeolocationPosition); },
    };
    Object.assign(window, { __liveLocationMock: mock });
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      watchPosition(onSuccess: PositionCallback, onError: PositionErrorCallback) {
        mock.starts++; success = onSuccess; failure = onError; active = true;
        queueMicrotask(() => {
          if (!active) return;
          if (errorCode) failure?.({ code: errorCode } as GeolocationPositionError);
          else mock.move(25.146, 75.852);
        });
        return 7;
      },
      clearWatch() { active = false; mock.stops++; },
    } });
  }, { errorCode });
}
type LocationMockWindow = Window & { __liveLocationMock: { starts: number; stops: number; move: (latitude: number, longitude: number) => void; late: () => void } };

test('live location is opt-in, filters nearby stays, updates on movement and stops cleanly', async ({ page }) => {
  await stubOpenMapStyle(page);
  await mockLiveLocation(page);
  await page.goto('/map');
  await expect(page.getByRole('button', { name: 'Use my location', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as LocationMockWindow).__liveLocationMock.starts)).toBe(0);
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  await page.getByRole('button', { name: 'Use my location', exact: true }).click();
  await expect(page.locator('.city-location-bar')).toContainText('Live location on');
  await expect(page.locator('.city-location-bar')).toContainText('accuracy about 20 m');
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-target', '25.146,75.852');
  await page.getByLabel('Distance from your location', { exact: true }).selectOption('1');
  await expect(page.locator('.city-stays')).toContainText('from your location');
  await expect(page.locator('.city-stays')).not.toContainText('Scholar');
  await expect(page).not.toHaveURL(/25\.146|75\.852/);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(stored);
  await page.evaluate(() => (window as LocationMockWindow).__liveLocationMock.move(28.61, 77.2));
  await expect(page.locator('.city-stay')).toHaveCount(0);
  await expect(page.locator('.city-empty')).toContainText('Demo inventory only covers parts of Kota');
  await page.getByRole('button', { name: 'Stop location', exact: true }).click();
  await expect(page.locator('.city-stay')).toHaveCount(7);
  expect(await page.evaluate(() => (window as LocationMockWindow).__liveLocationMock.stops)).toBe(1);
  await page.evaluate(() => (window as LocationMockWindow).__liveLocationMock.late());
  await expect(page.locator('.city-location-bar')).not.toContainText('Live location on');
  await page.getByRole('button', { name: 'Use my location', exact: true }).click();
  await expect(page.locator('.city-location-bar')).toContainText('Live location on');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Explore hostels', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as LocationMockWindow).__liveLocationMock.stops)).toBe(2);
});

for (const [code, message] of [[1, 'permission was denied'], [2, 'location is unavailable'], [3, 'Location timed out']] as const) {
  test(`location error ${code} explains recovery and leaves manual coaching search available`, async ({ page }) => {
    await stubOpenMapStyle(page);
    await mockLiveLocation(page, code);
    await page.goto('/map');
    await page.getByRole('button', { name: 'Use my location', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(message);
    await expect(page.getByRole('button', { name: 'Use my location', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Stop location', exact: true })).toHaveCount(0);
    await page.getByLabel('Centre map on a coaching campus').selectOption('pw-demo');
    await expect(page.locator('.student-city-map')).toHaveAttribute('data-target', '25.17,75.846');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('major demo coaching options include multiple ALLEN campuses, Vibrant and PW', async ({ page }) => {
  await stubOpenMapStyle(page);
  await page.goto('/map');
  const campuses = page.getByLabel('Centre map on a coaching campus');
  for (const id of ['allen-samyak', 'allen-sangyan', 'allen-satyarth', 'vibrant-demo', 'pw-demo', 'aakash-demo', 'unacademy-demo']) {
    await campuses.selectOption(id);
    await expect(page).toHaveURL(new RegExp(`campus=${id}`));
  }
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-map-mode', 'maplibre');
});

test('map location button starts, recentres and stops the same live location watch', async ({ page }) => {
  await stubOpenMapStyle(page);
  await mockLiveLocation(page);
  await page.goto('/map');
  const locate = page.getByRole('button', { name: 'Use my current location on map', exact: true });
  await expect(locate).toBeVisible();
  await expect(locate).toHaveAttribute('aria-pressed', 'false');
  await locate.click();
  const centre = page.getByRole('button', { name: 'Centre map on my current location', exact: true });
  await expect(centre).toHaveAttribute('aria-pressed', 'true');
  await expect(centre).toHaveClass(/is-active/);
  await expect(page.locator('.city-location-bar')).toContainText('Live location on');
  await page.getByRole('button', { name: 'Show Comfort Stay Hostel on map' }).click();
  await expect(page).toHaveURL(/hostel=h1/);
  await centre.click();
  await expect(page).not.toHaveURL(/hostel=/);
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-target', '25.146,75.852');
  expect(await page.evaluate(() => (window as LocationMockWindow).__liveLocationMock.starts)).toBe(1);
  await page.getByRole('button', { name: 'Turn off current location on map', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Use my current location on map', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => (window as LocationMockWindow).__liveLocationMock.stops)).toBe(1);
});

test('search selects our demo coaching and hostel pins instead of opening Google POIs', async ({ page }) => {
  await stubOpenMapStyle(page);
  await page.goto('/map');
  const search = page.getByLabel('Search a hostel, coaching or locality', { exact: true });
  await search.fill('PW');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/campus=pw-demo/);
  await expect(page).not.toHaveURL(/q=/);
  await search.fill('Comfort Stay');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/hostel=h1/);
  await expect(page).not.toHaveURL(/q=/);
});


// A tiny solid-colour PNG validates real raster decoding without claiming live satellite imagery.
async function stubSatellite(page: Page, fail = false) {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGNwi7cBIgYIBQAY0gOFjy4btgAAAABJRU5ErkJggg==', 'base64');
  await page.route('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer?f=json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ copyrightText: 'Test imagery contributor credits' }) }));
  await page.route('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/**', route => fail
    ? route.fulfill({ status: 503, body: 'Test imagery outage' }) : route.fulfill({ contentType: 'image/png', body: png }));
}

test('satellite imagery keeps the same map, selected hostel, filters, pitch and attribution', async ({ page }) => {
  await stubOpenMapStyle(page); await stubSatellite(page);
  await page.goto('/map?campus=allen-talwandi&radius=1&hostel=h1&view=3d');
  const canvas = await page.locator('.maplibregl-canvas').elementHandle();
  const compass = page.locator('.maplibregl-ctrl-compass .maplibregl-ctrl-icon');
  await expect(compass).toHaveAttribute('style', /rotateX\(50deg\)/);
  const selected = page.locator('.student-hostel-pin.is-selected');
  await expect(selected).toBeVisible();
  const before = (await selected.boundingBox())!;
  await page.getByRole('button', { name: 'Satellite', exact: true }).click();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-imagery-state', 'ready');
  await expect(page).toHaveURL(/type=satellite/);
  await expect(page).toHaveURL(/radius=1/);
  await expect(page.locator('.city-stay.is-selected')).toContainText('Comfort Stay');
  await expect(compass).toHaveAttribute('style', /rotateX\(50deg\)/);
  const after = (await selected.boundingBox())!;
  expect(after.x).toBeCloseTo(before.x, 0); expect(after.y).toBeCloseTo(before.y, 0);
  expect(await canvas!.evaluate(node => node.isConnected)).toBe(true);
  await expect(page.locator('.maplibregl-ctrl-attrib-inner')).toContainText('Test imagery contributor credits');
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-imagery-state', 'off');
  await expect(selected).toBeVisible();
  await expect(page).not.toHaveURL(/type=satellite/);
  await expect(page.locator('.maplibregl-ctrl-attrib-inner')).not.toContainText('Test imagery contributor credits');
});

test('a satellite outage falls back to streets and retry recovers without dropping pins', async ({ page }) => {
  await stubOpenMapStyle(page); await stubSatellite(page, true);
  await page.goto('/map?type=satellite');
  await expect(page.getByRole('alert')).toContainText('Satellite imagery could not load');
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-imagery-state', 'error');
  await expect(page.locator('.student-pin-group').first()).toBeVisible();
  await stubSatellite(page);
  await page.getByRole('button', { name: 'Retry satellite', exact: true }).click();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-imagery-state', 'ready');
  await expect(page.locator('.student-pin-group').first()).toBeVisible();
});

test('satellite switching preserves the active location watch and current-location marker', async ({ page }) => {
  await stubOpenMapStyle(page); await stubSatellite(page); await mockLiveLocation(page);
  await page.goto('/map');
  await page.getByRole('button', { name: 'Use my current location on map', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Your current location', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Satellite', exact: true }).click();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-imagery-state', 'ready');
  await expect(page.getByRole('img', { name: 'Your current location', exact: true })).toBeVisible();
  await expect(page.locator('.city-location-bar')).toContainText('Live location on');
  expect(await page.evaluate(() => (window as LocationMockWindow).__liveLocationMock.starts)).toBe(1);
});

test('the compact Explore map supports satellite without changing room results', async ({ page }) => {
  await stubOpenMapStyle(page); await stubSatellite(page);
  await page.goto('/explore?campus=allen-talwandi&sharing=double');
  await expect(page.locator('.student-city-map')).toBeVisible();
  const cards = await page.locator('.discovery-grid').textContent();
  await page.getByRole('button', { name: 'Satellite', exact: true }).click();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-imagery-state', 'ready');
  expect(await page.locator('.discovery-grid').textContent()).toBe(cards);
  await expect(page).toHaveURL(/sharing=double/);
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-imagery-state', 'off');
});

test('cutaway cards switch to photos without changing the matched room, costs or comparison', async ({ page }) => {
  await stubOpenMapStyle(page);
  await page.goto('/explore?campus=allen-talwandi&sharing=double&maxBudget=8000');
  const card = page.locator('.discovery-grid article').first();
  await expect(card.locator('.room-card-stage')).toHaveAttribute('data-preview', 'room');
  await expect(card.locator('.room-card-sharing')).toHaveText('2 students / room');
  await expect(card.locator('.room-card-disclaimer')).toContainText('not a measured floor plan');
  const price = await card.locator('.discovery-card-pricing').textContent();
  const href = await card.locator('.discovery-card-cta').getAttribute('href');
  await card.getByRole('button', { name: 'Photos', exact: true }).click();
  const image = card.locator('.room-card-photo');
  const firstPhoto = await image.getAttribute('src');
  await card.getByRole('button', { name: /Next photo of/ }).click();
  await expect(image).not.toHaveAttribute('src', firstPhoto!);
  await card.getByRole('button', { name: /Previous photo of/ }).click();
  await expect(image).toHaveAttribute('src', firstPhoto!);
  await card.getByRole('button', { name: /Add .* to comparison/ }).click();
  await expect(card.getByRole('button', { name: /Remove .* from comparison/ })).toHaveAttribute('aria-pressed', 'true');
  await card.getByRole('button', { name: 'Room', exact: true }).click();
  expect(await card.locator('.discovery-card-pricing').textContent()).toBe(price);
  await expect(card.locator('.discovery-card-cta')).toHaveAttribute('href', href!);
  await card.locator('.discovery-card-cta').click();
  await expect(page).toHaveURL(/hostel\/h1\/preview\?.*room=rt2/);
});

test('card preview buttons work with a keyboard and reduced motion on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/explore?sharing=double&maxBudget=8000');
  const card = page.locator('.discovery-grid article').first();
  const photos = card.getByRole('button', { name: 'Photos', exact: true });
  await photos.focus(); await page.keyboard.press('Enter');
  await expect(card.locator('.room-card-stage')).toHaveAttribute('data-preview', 'photos');
  expect(await card.locator('.room-card-photo').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
  const next = card.getByRole('button', { name: /Next photo of/ });
  await next.focus(); await page.keyboard.press('Enter');
  await expect(card.locator('.room-card-photo-controls')).toContainText('02');
  await card.getByRole('button', { name: 'Room', exact: true }).click();
  expect(await card.locator('.room-card-model').evaluate(node => getComputedStyle(node).transform)).toBe('none');
  const widths = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(widths.actual).toBeLessThanOrEqual(widths.viewport);
});

test('homepage hostel preference reaches results and can be reset', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('group', { name: 'Hostel preference' }).getByRole('button', { name: 'Girls', exact: true }).click();
  await page.getByRole('button', { name: 'Find my stay', exact: true }).click();
  await expect(page).toHaveURL(/category=girls/);
  for (const card of await page.locator('.discovery-grid article').all()) await expect(card).toContainText('For girls');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('.discovery-grid article')).toHaveCount(6);
});

test('Explore cards highlight matching pins and map clicks open the same-room public preview', async ({ page }) => {
  await stubOpenMapStyle(page);
  await page.goto('/explore?campus=allen-talwandi&sharing=double');
  const first = page.locator('.discovery-grid article').first();
  await first.getByRole('button',{name:'Show on map'}).click();
  await expect(first).toHaveClass(/discovery-card--active/);
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-target','25.148,75.852');
  await page.getByRole('button',{name:'Select Comfort Stay Hostel on map'}).click();
  await expect(page).toHaveURL(/hostel\/h1\/preview\?.*room=rt2/);
  await expect(page.locator('.hostel-preview-price')).toContainText('₹5,500');
  await page.getByRole('link',{name:'Back to nearby stays',exact:true}).click();
  await expect(page).toHaveURL(/explore\?.*sharing=double/);
  await page.getByRole('button',{name:'Centre on campus',exact:true}).click();
  await expect(page.locator('.student-city-map')).toHaveAttribute('data-target','25.146,75.852');
});

test('mobile map click opens a responsive preview and returns to the existing filter sheet', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await stubOpenMapStyle(page);
  await page.goto('/explore?campus=allen-talwandi');
  await page.locator('.discovery-grid article').first().getByRole('button',{name:'Show on map'}).click();
  await page.getByRole('button',{name:'Select Comfort Stay Hostel on map'}).click();
  await expect(page.locator('.hostel-preview-summary')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('link',{name:'Back to nearby stays',exact:true}).click();
  await page.getByRole('button',{name:/All filters/}).click();
  const bounds=await page.getByRole('dialog').boundingBox();
  expect(Math.abs(bounds!.y+bounds!.height-844)).toBeLessThan(2);
  await page.keyboard.press('Escape');
});

test('owner coordinates reject swaps and can be saved and cleared without restoring demo pins', async ({ page }) => {
  await page.goto('/login?role=owner');
  await page.getByRole('button', { name: 'Use sample owner account' }).click();
  await expect(page).toHaveURL(/\/owner$/);
  await page.goto('/owner/listing/h1/edit');
  await page.getByLabel('Hostel latitude').fill('75.852');
  await page.getByLabel('Hostel longitude').fill('25.148');
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(page.getByRole('alert')).toContainText('within Kota');
  await page.getByLabel('Hostel latitude').fill('25.15123');
  await page.getByLabel('Hostel longitude').fill('75.85123');
  await page.getByRole('button', { name: /Save draft/i }).click();
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('staykota_hostels') || '[]').find((h: {id:string}) => h.id === 'h1')?.latitude)).toBe(25.15123);
  await page.reload();
  await expect(page.getByLabel('Hostel latitude')).toHaveValue('25.15123');
  await page.getByLabel('Hostel latitude').fill('');
  await page.getByLabel('Hostel longitude').fill('');
  await page.getByRole('button', { name: /Save draft/i }).click();
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('staykota_hostels') || '[]').find((h: {id:string}) => h.id === 'h1')?.latitude)).toBeUndefined();
  await page.reload();
  await expect(page.getByLabel('Hostel latitude')).toHaveValue('');
  await expect(page.getByLabel('Hostel longitude')).toHaveValue('');
});

test('curved showroom navigates real photo indices with arrows, keyboard, drag and trackpad', async ({ page }) => {
  await sampleStudent(page);
  await page.goto('/hostel/h1?room=rt2&campus=allen-talwandi');
  const gallery = page.getByRole('region', { name: 'Comfort Stay Hostel photo showroom' });
  const caption = gallery.locator('.curved-gallery__caption');
  await expect(caption).toContainText('01 / 03');
  await gallery.getByRole('button', { name: 'Next showroom photo' }).click();
  await expect(caption).toContainText('02 / 03');
  await gallery.focus(); await page.keyboard.press('ArrowRight');
  await expect(caption).toContainText('03 / 03');
  await page.keyboard.press('Home');
  await expect(caption).toContainText('01 / 03');
  const box = (await gallery.locator('.curved-gallery__scene').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 80, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(caption).toContainText('02 / 03');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.mouse.wheel(100, 0);
  await expect(caption).toContainText('03 / 03');
  const y = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y);
  await expect(caption).toContainText('03 / 03');
  await gallery.getByRole('button', { name: 'Open hostel photo gallery' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.detail-lightbox__controls')).toContainText('3 / 3');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page).toHaveURL(/room=rt2/);
});

test('curved showroom supports mobile swipe, reduced motion and honest contact/map fallbacks', async ({ page }) => {
  await sampleStudent(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stubOpenMapStyle(page);
  await page.goto('/hostel/h1?room=rt2&campus=allen-talwandi');
  const gallery = page.locator('.curved-gallery');
  const scene = gallery.locator('.curved-gallery__scene');
  const box = (await scene.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width * .7, y: box.y + box.height / 2 }] });
  for (let step = 1; step <= 6; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * (.7 - .4 * step / 6), y: box.y + box.height / 2 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(gallery.locator('.curved-gallery__caption')).toContainText('02 / 03');
  expect(await gallery.locator('.is-centred').evaluate(el => Math.max(...getComputedStyle(el).transitionDuration.split(',').map(value => parseFloat(value))))).toBeLessThanOrEqual(.001);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + 180 }] });
  for (let step = 1; step <= 5; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width / 2, y: box.y + 180 - step * 20 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore);
  await expect(gallery.locator('.curved-gallery__caption')).toContainText('02 / 03');
  await page.getByRole('button', { name: 'Contact hostel', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Owner contact details have not been supplied');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('.detail-proximity')).toContainText('Exact locations are still being checked');
  await expect(page.locator('.detail-proximity .student-map-mount')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Walking directions/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Preview demo map' }).click();
  await expect(page.locator('.detail-proximity .student-city-map')).toBeVisible();
  await expect(page.locator('.detail-proximity .student-campus-pin')).toHaveCount(1);
  await expect(page.locator('.detail-proximity .student-hostel-pin')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('showroom handles missing and failed photos without inventing property imagery', async ({ page }) => {
  await sampleStudent(page);
  await page.evaluate(() => {
    const hostels = JSON.parse(localStorage.getItem('staykota_hostels') || '[]');
    const hostel = hostels.find((h: { id: string }) => h.id === 'h1');
    hostel.coverImage = ''; hostel.images = [];
    delete hostel.latitude; delete hostel.longitude;
    localStorage.setItem('staykota_hostels', JSON.stringify(hostels));
  });
  await page.goto('/hostel/h1');
  await expect(page.getByText('Photos are on their way.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next showroom photo' })).toBeDisabled();
  await expect(page.locator('.detail-proximity')).toContainText('Distance unavailable');
  await page.evaluate(() => {
    const hostels = JSON.parse(localStorage.getItem('staykota_hostels') || '[]');
    const hostel = hostels.find((h: {id:string}) => h.id === 'h1');
    hostel.coverImage = '/images/missing-test.webp'; hostel.images = [];
    localStorage.setItem('staykota_hostels', JSON.stringify(hostels));
  });
  let fail = true;
  await page.route('**/images/missing-test.webp', async route => fail ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ status: 200, contentType: 'image/webp', path: 'public/images/room-single.webp' }));
  await page.goto('/hostel/h1');
  await expect(page.locator('.curved-gallery')).toContainText('Photo unavailable');
  await expect(page.getByRole('button', { name: 'Next showroom photo' })).toBeDisabled();
  fail = false;
  await page.getByRole('button', { name: 'Reload photos' }).click();
  await expect(page.locator('.curved-gallery__failed')).toHaveCount(0);
  await expect.poll(() => page.locator('.curved-gallery__slide img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

test('Kota limits constrain real camera pan, zoom, slider and outside-area live location', async ({ page }) => {
  await stubOpenMapStyle(page);
  await mockLiveLocation(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/map?campus=allen-talwandi');
  const map = page.locator('.student-city-map');
  await expect(map).toHaveAttribute('data-map-area', 'kota-plus-3km');
  const initialZoom = Number(await map.getAttribute('data-camera-zoom'));
  await page.locator('.maplibregl-ctrl-zoom-in').click();
  await expect.poll(async () => Number(await map.getAttribute('data-camera-zoom'))).toBeGreaterThan(initialZoom);
  await page.getByRole('slider', { name: 'Map zoom level' }).focus();
  await page.keyboard.press('End');
  await expect.poll(async () => Number(await map.getAttribute('data-camera-zoom'))).toBeCloseTo(19, 1);
  for (let index=0; index<15; index++) { if (!(await page.locator('.maplibregl-ctrl-zoom-out').isEnabled())) break; await page.locator('.maplibregl-ctrl-zoom-out').click(); }
  expect(Number(await map.getAttribute('data-camera-zoom'))).toBeGreaterThan(10);
  const canvas = (await page.locator('.maplibregl-canvas').boundingBox())!;
  await page.mouse.move(canvas.x + canvas.width * .4, canvas.y + canvas.height * .6);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width * .9, canvas.y + canvas.height * .9, { steps: 15 });
  await page.mouse.up();
  const centre = (await map.getAttribute('data-camera-centre'))!.split(',').map(Number);
  expect(centre[0]).toBeGreaterThan(25.05); expect(centre[0]).toBeLessThan(25.29);
  expect(centre[1]).toBeGreaterThan(75.72); expect(centre[1]).toBeLessThan(75.97);
  await page.getByRole('button', { name: 'Use my location', exact: true }).click();
  await expect(page.locator('.city-location-bar')).toContainText('Live location on');
  await page.evaluate(() => (window as LocationMockWindow).__liveLocationMock.move(28.61,77.2));
  await expect(page.locator('.student-outside-area')).toContainText('outside the Kota map area');
  await expect(map).toHaveAttribute('data-camera-centre', '25.183000,75.839000');
  await page.getByRole('button', { name: 'Stop location', exact: true }).click();
  await page.getByRole('button', { name: 'Reset Kota view' }).click();
  await expect(map).toHaveAttribute('data-camera-centre', '25.183000,75.839000');
  await page.setViewportSize({ width:390, height:844 });
  await expect.poll(async () => {
    const snapshot = await map.evaluate(node => { const canvas = node.querySelector<HTMLElement>('.student-city-map__canvas')!; return { width: canvas.clientWidth, height: canvas.clientHeight, minimum: Number(node.querySelector<HTMLInputElement>('input[type=range]')!.min) }; });
    return Math.abs(snapshot.minimum - Math.max(0, minimumKotaZoom(snapshot.width,snapshot.height)));
  }).toBeLessThan(.005);
});

test('circular hostel and coaching previews open on hover/focus without selecting, and preserve click actions', async ({ page }) => {
  await stubOpenMapStyle(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/map?campus=allen-talwandi');
  const map = page.locator('.student-city-map');
  const hostel = page.getByRole('button', { name: 'Select Comfort Stay Hostel on map', exact: true });
  const coaching = page.getByRole('button', { name: /Select ALLEN Talwandi campus/ });
  await page.locator('.maplibregl-ctrl-zoom-in').click();
  await page.locator('.maplibregl-ctrl-zoom-in').click();
  await expect(hostel).toBeVisible();
  const url = page.url(), centre = await map.getAttribute('data-camera-centre');
  await hostel.hover();
  const preview = page.locator('.map-circle-preview[data-preview-id="h1"]');
  await expect(preview).toBeVisible();
  expect((await preview.boundingBox())!.width).toBeCloseTo(164,0);
  await expect(preview).toHaveAccessibleName(/Comfort Stay Hostel/);
  await expect(page.locator('.city-selected')).toHaveCount(0);
  expect(page.url()).toBe(url); expect(await map.getAttribute('data-camera-centre')).toBe(centre);
  const ring = (await preview.boundingBox())!;
  await page.mouse.move(ring.x + ring.width / 2 + 65, ring.y + ring.height / 2);
  await expect(preview).toBeVisible();
  await page.keyboard.press('Escape'); await expect(preview).toHaveCount(0);
  await coaching.focus();
  await expect(page.locator('.map-circle-preview[data-preview-id="allen-talwandi"]')).toBeVisible();
  expect(page.url()).toBe(url);
  await page.keyboard.press('Escape');
  await hostel.click();
  await expect(page).toHaveURL(/hostel\/h1\/preview/);
  await expect(page.getByRole('heading',{name:'Comfort Stay Hostel',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Back to Kota map',exact:true}).click();
  await coaching.click();
  await expect(page).not.toHaveURL(/hostel=h1/);
  await expect(map).toHaveAttribute('data-target','25.146,75.852');
});

test('guest preview shows a summary and login returns to the same hostel and room', async ({ page }) => {
  await page.goto('/hostel/h1/preview?campus=allen-talwandi&room=rt2&returnTo=%2Fmap%3Fcampus%3Dallen-talwandi%26sharing%3Ddouble');
  await expect(page.getByRole('heading',{name:'Comfort Stay Hostel',exact:true})).toBeVisible();
  await expect(page.locator('.hostel-preview-price')).toContainText('₹5,500');
  await expect(page.locator('.hostel-preview-address')).toContainText('12, Near Allen');
  await expect(page.locator('.hostel-preview-visual>img')).toBeVisible();
  await expect(page.locator('.detail-page,.curved-gallery,.detail-price')).toHaveCount(0);
  await page.getByRole('link',{name:'See full details',exact:true}).click();
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.locator('.login-return-card')).toContainText('Comfort Stay Hostel');
  const redirect=new URL(page.url()).searchParams.get('redirect')!;
  expect(new URL(redirect,'https://staykota.invalid').searchParams.get('room')).toBe('rt2');
  await page.getByRole('button',{name:'Use sample student account'}).click();
  await expect(page.locator('.detail-page')).toBeVisible();
  await expect(page).toHaveURL(/\/hostel\/h1\?.*room=rt2/);
  await expect(page.locator('.detail-room-option.is-selected')).toContainText('Double Sharing');
  await page.reload();
  await expect(page.locator('.detail-page')).toBeVisible();
  await page.getByRole('button',{name:'Log out',exact:true}).click();
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.locator('.detail-page')).toHaveCount(0);
});

test('direct full-detail URLs require login without rendering protected details', async ({ page }) => {
  await page.goto('/hostel/h1?campus=allen-talwandi&room=rt2#detail-rooms');
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.locator('.detail-price,.detail-room-options,.curved-gallery')).toHaveCount(0);
  const target=new URL(page.url()).searchParams.get('redirect')!;
  expect(target).toBe('/hostel/h1?campus=allen-talwandi&room=rt2#detail-rooms');
  await page.reload();
  await expect(page.locator('.login-return-card')).toContainText('Comfort Stay Hostel');
  await page.getByRole('link',{name:'Back to preview',exact:true}).click();
  await expect(page).toHaveURL(/\/hostel\/h1\/preview/);
  await expect(page.locator('.hostel-preview-price')).toContainText('₹5,500');
});

test('student registration keeps the intended full-detail destination and authenticated previews open directly', async ({ page }) => {
  await page.goto('/hostel/h1/preview?campus=allen-talwandi&room=rt2');
  await page.getByRole('link',{name:'Create an account',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Create a demo account'})).toBeVisible();
  await page.getByLabel('Mobile number', {exact:true}).fill('9876543210');
  await page.getByRole('button',{name:'Send OTP',exact:true}).click();
  for(let i=1;i<=4;i++) await page.getByRole('textbox',{name:`OTP digit ${i}`}).fill('4');
  await page.getByRole('button',{name:'Verify & create account',exact:true}).click();
  await expect(page.locator('.detail-page')).toBeVisible();
  await expect(page).toHaveURL(/\/hostel\/h1\?.*room=rt2/);
  await page.goto('/hostel/h1/preview?campus=allen-talwandi&room=rt2');
  await page.getByRole('link',{name:'See full details',exact:true}).click();
  await expect(page.locator('.detail-page')).toBeVisible();
  await expect(page).not.toHaveURL(/login/);
});

test('preview protects unpublished hostels, rejects unsafe returns and handles cover failure', async ({ page }) => {
  await page.goto('/hostel/h5/preview');
  await expect(page.getByRole('heading',{name:'This stay isn’t on the map.'})).toBeVisible();
  await page.route('**/images/room-shared.webp',route=>route.fulfill({status:404,body:''}));
  await page.goto('/hostel/h1/preview?returnTo=https%3A%2F%2Fexample.com&room=rt2');
  await expect(page.getByText('Cover photo unavailable',{exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Back to nearby stays',exact:true})).toHaveAttribute('href',/^\/explore\?/);
  await expect(page.locator('.hostel-preview-price')).toContainText('₹5,500');
  await expect(page.getByRole('link',{name:'See full details',exact:true})).toBeVisible();
});
