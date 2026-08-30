import assert from 'node:assert/strict';

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const cases = [
  ['/el', 'Σωστή εγκατάσταση'], ['/en', 'Correct installation'],
  ['/el/renovations', 'Η εγκατάσταση προσαρμόζεται'], ['/en/new-builds', 'electrical infrastructure'],
  ['/el/repairs', 'Πρώτα βρίσκουμε την αιτία'], ['/en/projects', 'Projects &amp; example services'],
  ['/el/projects/new-home-installation-example', 'Ηλεκτρολογική εγκατάσταση νέας κατοικίας'],
  ['/en/contact', 'Send the key information'], ['/admin', 'Ρύθμιση διαχείρισης'],
  ['/robots.txt', 'Disallow: /admin'], ['/sitemap.xml', '/en/contact'],
];

for (const [path, expected] of cases) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  assert.match(await response.text(), new RegExp(expected), `${path} is missing expected content`);
}

const invalid = await fetch(`${base}/api/appointments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
assert.equal(invalid.status, 422, 'Invalid appointment data must be rejected');
console.log(`Smoke tests passed: ${cases.length} routes and appointment validation.`);
