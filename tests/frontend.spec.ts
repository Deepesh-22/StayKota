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
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/hostel/h1?room=rt2');
  await page.getByRole('button', { name: 'Open hostel photo gallery' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Next photo' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('custom map shows only hostels near the coaching with no external map requests', async ({ page }) => {
  const externalMaps: string[] = [];
  page.on('request', request => { if (/google|mapbox|openstreetmap|arcgis|maptiler/i.test(request.url())) externalMaps.push(request.url()); });
  await page.goto('/map?campus=allen-talwandi');
  await expect(page.getByRole('heading', { name: 'Near your coaching' })).toBeVisible();
  await expect(page.locator('.coaching-map')).toBeVisible();
  await expect(page.locator('.coaching-map [data-hostel-id="h1"]')).toHaveCount(1);
  await expect(page.locator('.coaching-map [data-hostel-id="h2"]')).toHaveCount(0);
  await expect(page.locator('.coaching-map [data-hostel-id="h5"]')).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Satellite', exact: true })).toHaveCount(0);
  await expect(page.locator('.coaching-map-campus')).toContainText('Talwandi');
  expect(externalMaps).toEqual([]);
});

test('2D and illustrated 3D retain the same nearby pins and selected property', async ({ page }) => {
  await page.goto('/map?campus=allen-talwandi');
  await page.getByRole('button', { name: /Select Comfort Stay Hostel,/ }).click();
  await expect(page.locator('.city-selected')).toContainText('Comfort Stay');
  const pins = await page.locator('[data-hostel-id]').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-hostel-id')));
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.locator('.coaching-map')).toHaveAttribute('data-perspective', '3d');
  expect(await page.locator('[data-hostel-id]').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-hostel-id')))).toEqual(pins);
  await expect(page.locator('.city-selected')).toContainText('Comfort Stay');
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.locator('.coaching-map')).toHaveAttribute('data-perspective', '2d');
  await page.getByRole('button', { name: 'Zoom in on neighbourhood' }).click();
  await expect(page.locator('.coaching-map-controls')).toContainText('125%');
  await page.getByRole('button', { name: 'Reset neighbourhood view', exact: true }).click();
  await expect(page.locator('.coaching-map-controls')).toContainText('100%');
});

test('changing coaching replaces nearby hostels and preserves the radius', async ({ page }) => {
  await page.goto('/map?campus=allen-talwandi&hostel=h1');
  await page.getByLabel('Choose a coaching campus').selectOption('allen-landmark');
  await expect(page.locator('[data-hostel-id]')).toHaveCount(1);
  await expect(page.locator('[data-hostel-id="h2"]')).toHaveCount(1);
  await expect(page.locator('.city-selected')).toHaveCount(0);
  await page.getByLabel('Choose a coaching campus').selectOption('allen-talwandi');
  await page.getByLabel('Distance from coaching', { exact: true }).selectOption('3');
  await expect(page.locator('[data-hostel-id="h3"]')).toHaveCount(1);
  await expect(page.locator('[data-hostel-id="h2"]')).toHaveCount(0);
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page).toHaveURL(/radius=3/);
});

test('local search and empty filters keep the coaching visible without unrelated hostels', async ({ page }) => {
  await page.goto('/map?campus=allen-talwandi');
  await page.getByLabel('Search nearby hostels', { exact: true }).fill('Comfort');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('[data-hostel-id]')).toHaveCount(1);
  await expect(page).toHaveURL(/campus=allen-talwandi/);
  await page.getByLabel('Map monthly budget').selectOption('5000');
  await page.getByLabel('Map room sharing').selectOption('single');
  await expect(page.locator('[data-hostel-id]')).toHaveCount(0);
  await expect(page.locator('.coaching-map-campus')).toContainText('ALLEN');
  await expect(page.locator('.coaching-map-empty')).toBeVisible();
  await page.getByRole('button', { name: 'Reset neighbourhood', exact: true }).click();
  await expect(page.getByLabel('Distance from coaching', { exact: true })).toHaveValue('1');
});

test('mobile custom map fits the viewport and hostel panel releases focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/map?campus=allen-talwandi');
  await expect(page.locator('.coaching-map')).toBeVisible();
  const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, height: document.documentElement.scrollHeight, window: innerHeight }));
  expect(size.width).toBeLessThanOrEqual(size.viewport);
  expect(size.height).toBeLessThanOrEqual(size.window + 1);
  await page.getByRole('button', { name: /Stays \(/ }).click();
  await expect(page.getByRole('dialog', { name: 'Hostel filters and sample stays' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close hostel list' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Stays \(/ })).toBeFocused();
  await page.getByRole('button', { name: /Stays \(/ }).click();
  await page.setViewportSize({ width:1024, height:768 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
