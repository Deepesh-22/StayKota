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

// Google is an external service. These checks validate integration state and URLs,
// not Google's map content, tile availability or authenticated SDK rendering.
async function stubGoogleFrame(page: Page) {
  await page.route('https://www.google.com/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><p>External Google frame stub for integration tests.</p></body></html>' }));
}

test('whole Kota map opens city-wide and switches real-map layers', async ({ page }) => {
  await stubGoogleFrame(page);
  await page.goto('/map');
  await expect(page.getByRole('heading', { name: 'Explore Kota', exact: true })).toBeVisible();
  const frame = page.getByTitle('Google map of the whole city of Kota');
  await expect(frame).toBeVisible();
  const initial = new URL((await frame.getAttribute('src'))!);
  expect(initial.origin).toBe('https://www.google.com');
  expect(initial.searchParams.get('q')).toBe('25.183,75.839');
  expect(initial.searchParams.get('z')).toBe('12');
  await expect(page.locator('.discovery-map-illustration')).toHaveCount(0);
  await page.getByRole('button', { name: 'Satellite', exact: true }).click();
  await expect(frame).toHaveAttribute('src', /t=k/);
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await expect(frame).toHaveAttribute('src', /t=m/);
});

test('city place search, campus and sample stay selection update Google view', async ({ page }) => {
  await stubGoogleFrame(page);
  await page.goto('/map');
  const frame = page.getByTitle('Google map of the whole city of Kota');
  await page.getByLabel('Search an area, road or landmark in Kota').fill('Chambal Garden');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/q=Chambal/);
  await expect(frame).toHaveAttribute('src', /Chambal/);
  await page.getByRole('button', { name: 'Whole Kota', exact: true }).click();
  await expect(page).not.toHaveURL(/q=/);
  await page.getByLabel('Centre map on a coaching campus').selectOption('allen-talwandi');
  await expect(frame).toHaveAttribute('src', /25.146%2C75.852/);
  await page.getByRole('button', { name: 'Show Comfort Stay Hostel on map' }).click();
  await expect(page).toHaveURL(/hostel=h1/);
  await expect(frame).toHaveAttribute('src', /25.148%2C75.852/);
  await expect(page.locator('.city-selected')).toContainText('Comfort Stay');
  await page.getByRole('button', { name: 'Whole Kota', exact: true }).click();
  await expect(frame).toHaveAttribute('src', /25.183%2C75.839/);
  await expect(frame).toHaveAttribute('src', /z=12/);
});

test('city stay filters preserve room matching without hiding the actual city', async ({ page }) => {
  await stubGoogleFrame(page);
  await page.goto('/map?sharing=single&budget=5000&hostel=h5');
  await expect(page.locator('.city-stay')).toHaveCount(0);
  await expect(page.locator('.city-empty')).toBeVisible();
  await expect(page.getByTitle('Google map of the whole city of Kota')).toBeVisible();
  await expect(page.locator('.city-selected')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset room filters' }).click();
  await expect(page.locator('.city-stay')).toHaveCount(7);
  await expect(page.locator('.city-stays')).not.toContainText('Focus Nest');
  await expect(page.locator('.city-selected')).toHaveCount(0);
});

test('mobile city map has an accessible hostel panel and a viewport-sized layout', async ({ page }) => {
  await stubGoogleFrame(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/map');
  await expect(page.getByTitle('Google map of the whole city of Kota')).toBeVisible();
  const sizes = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, height: document.documentElement.scrollHeight, window: innerHeight }));
  expect(sizes.width).toBeLessThanOrEqual(sizes.viewport);
  expect(sizes.height).toBeLessThanOrEqual(sizes.window + 1);
  await page.getByRole('button', { name: /Stays \(/ }).click();
  await expect(page.getByRole('dialog', { name: 'Hostel filters and sample stays' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close hostel list' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Stays \(/ })).toBeFocused();
  await page.getByRole('button', { name: /Stays \(/ }).click();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Centre map on a coaching campus')).toBeVisible();
});

test('coaching radius filters stay consistent across map layers and city reset', async ({ page }) => {
  await stubGoogleFrame(page);
  await page.goto('/map');
  const radius = page.getByLabel('Distance from coaching', { exact: true });
  await expect(radius).toBeDisabled();
  await page.getByLabel('Centre map on a coaching campus').selectOption('allen-talwandi');
  await radius.selectOption('3');
  await expect(page.getByTitle('Google map of the whole city of Kota')).toHaveAttribute('src', /z=13/);
  await radius.selectOption('1');
  await expect(page.getByRole('button', { name: 'Show Comfort Stay Hostel on map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Scholar’s PG on map' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Show Comfort Stay Hostel on map' }).click();
  const ids = await page.locator('.city-stay-select').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')));
  await page.getByRole('button', { name: 'Satellite', exact: true }).click();
  await expect(page).toHaveURL(/radius=1/);
  await expect(page).toHaveURL(/hostel=h1/);
  await expect(page.getByTitle('Google map of the whole city of Kota')).toHaveAttribute('src', /t=k/);
  expect(await page.locator('.city-stay-select').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')))).toEqual(ids);
  await page.getByLabel('Centre map on a coaching campus').selectOption('allen-landmark');
  await expect(page.locator('.city-stay')).toHaveCount(1);
  await expect(page.locator('.city-selected')).toHaveCount(0);
  await expect(page.locator('.city-stays')).toContainText('Scholar');
  await page.getByRole('button', { name: 'Whole Kota', exact: true }).click();
  await expect(radius).toBeDisabled();
  await expect(page.locator('.city-stay')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Satellite', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('2D and 3D perspective controls are separate from imagery and explain the embed limit', async ({ page }) => {
  await stubGoogleFrame(page);
  await page.goto('/map?campus=allen-talwandi&radius=1&hostel=h1&view=3d');
  const flat = page.getByRole('button', { name: '2D', exact: true });
  const tilted = page.getByRole('button', { name: '3D tilt', exact: true });
  await expect(flat).toHaveAttribute('aria-pressed', 'true');
  await expect(tilted).toBeDisabled();
  await expect(page.locator('#city-perspective-help')).toContainText('3D tilt requires');
  await page.getByRole('button', { name: 'Satellite', exact: true }).click();
  await expect(flat).toHaveAttribute('aria-pressed', 'true');
  await expect(tilted).toBeDisabled();
  await flat.click();
  await expect(page).not.toHaveURL(/view=3d/);
  await expect(page).toHaveURL(/hostel=h1/);
  await expect(page).toHaveURL(/radius=1/);
  await expect(page.getByTitle('Google map of the whole city of Kota')).toHaveAttribute('src', /t=k/);
});
