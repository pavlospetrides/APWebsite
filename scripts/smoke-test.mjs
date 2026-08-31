import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';

function decodeBase32(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = value.toUpperCase().replace(/=|\s/g, '');
  let bits = '';
  for (const character of clean) {
    const index = alphabet.indexOf(character);
    assert.notEqual(index, -1, 'Supabase returned an invalid TOTP secret');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  return Buffer.from(bytes);
}

function currentTotp(secret) {
  const counter = Math.floor(Date.now() / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

async function readEnvironment() {
  const text = await fs.readFile('.env.local', 'utf8').catch(() => '');
  return Object.fromEntries(text.split(/\r?\n/).filter((line) => line && !line.trim().startsWith('#') && line.includes('=')).map((line) => {
    const index = line.indexOf('=');
    return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
  }));
}

const publicCases = [
  ['/el', 'Σωστή εγκατάσταση'],
  ['/en', 'Correct installation'],
  ['/el/renovations', 'Η εγκατάσταση προσαρμόζεται'],
  ['/en/renovations', 'Coordinated with the renovation programme'],
  ['/el/new-builds', 'Εργασία ανά στάδιο κατασκευής'],
  ['/en/new-builds', 'electrical infrastructure'],
  ['/el/repairs', 'Πρώτα βρίσκουμε την αιτία'],
  ['/en/repairs', 'A methodical check before intervention'],
  ['/en/projects', 'Projects &amp; electrical work'],
  ['/en/contact', 'Send the key information'],
  ['/el/privacy', 'Υπεύθυνος επεξεργασίας'],
  ['/en/privacy', 'Purposes and legal bases'],
  ['/el/cookies', 'Απογραφή cookies και αποθήκευσης'],
  ['/en/cookies', 'Why no banner is shown'],
  ['/el/legal', 'Πάροχος της ιστοσελίδας'],
  ['/en/legal', 'Electronic-commerce disclosures'],
  ['/el/terms', 'Αιτήματα και ραντεβού'],
  ['/en/terms', 'Assessment, quotation, and contract'],
  ['/robots.txt', 'Disallow: /admin'],
  ['/sitemap.xml', '/en/privacy'],
];

const publicBodies = new Map();
for (const [pathname, expected] of publicCases) {
  const response = await fetch(`${base}${pathname}`);
  assert.equal(response.status, 200, `${pathname} returned ${response.status}`);
  assert.equal(response.headers.get('set-cookie'), null, `${pathname} unexpectedly set a cookie`);
  const body = await response.text();
  publicBodies.set(pathname, body);
  assert.match(body, new RegExp(expected), `${pathname} is missing expected content`);
}

const legalPaths = ['/el/privacy', '/en/privacy', '/el/cookies', '/en/cookies', '/el/legal', '/en/legal', '/el/terms', '/en/terms'];
const internalComplianceLanguage = /REQUIRED BEFORE PUBLIC LAUNCH|\bTODO\b|\bpending\b|owner must|must be confirmed|public launch remains blocked|repository remains|Vercel compatibility|Supabase (?:project )?region|DPA verification|full geographic establishment address remains|εκκρεμεί|ο ιδιοκτήτης πρέπει/i;
for (const pathname of legalPaths) {
  assert.doesNotMatch(publicBodies.get(pathname), internalComplianceLanguage, `${pathname} exposed an internal compliance note`);
}

for (const [pathname, body] of publicBodies) {
  if (!pathname.startsWith('/el') && !pathname.startsWith('/en')) continue;
  assert.doesNotMatch(body, /ΦΠΑ|\bVAT\b|VAT number|VAT status|VAT registered|not VAT registered/i, `${pathname} exposed VAT information`);
  const expectedCredit = pathname.startsWith('/el')
    ? 'Σχεδιασμός &amp; ανάπτυξη ιστοσελίδας από'
    : 'Website design &amp; development by';
  assert.match(body, new RegExp(expectedCredit), `${pathname} is missing the localized CPU Clinic credit`);
  assert.match(body, /href="https:\/\/cpuclinic\.eu" target="_blank" rel="noopener noreferrer">CPU Clinic<\/a>/, `${pathname} has an unsafe or incorrect CPU Clinic link`);
  assert.equal((body.match(/>CPU Clinic<\/a>/g) || []).length, 1, `${pathname} contains a duplicate CPU Clinic credit`);
}

const contactPage = await (await fetch(`${base}/en/contact`)).text();
assert.match(contactPage, /Privacy Policy/, 'Appointment form is missing its privacy notice link');
assert.match(contactPage, /does not confirm an appointment/, 'Appointment form is missing the no-contract disclaimer');
assert.doesNotMatch(contactPage, /name="consent"/, 'Appointment form still requires a consent checkbox');

const hiddenAdmin = await fetch(`${base}/admin`);
const hiddenAdminBody = await hiddenAdmin.text();
assert.equal(hiddenAdmin.status, 404, '/admin must be indistinguishable from a missing page');
assert.doesNotMatch(hiddenAdminBody, /administrator|admin login|access denied|supabase|sign in/i, '/admin leaked administrative information');
assert.match(hiddenAdmin.headers.get('x-robots-tag') || '', /noindex/i, '/admin is missing X-Robots-Tag');
assert.match(hiddenAdmin.headers.get('cache-control') || '', /no-store/i, '/admin is not marked no-store');

const env = await readEnvironment();
if (env.PRIVATE_ADMIN_LOGIN_PATH) {
  const privateEntry = await fetch(`${base}${env.PRIVATE_ADMIN_LOGIN_PATH}`);
  assert.equal(privateEntry.status, 200, 'Configured private login route is unavailable');
  assert.match(await privateEntry.text(), /Καλώς ήρθατε|Έλεγχος ασφαλούς συνεδρίας/, 'Private route did not render the login flow');
  assert.match(privateEntry.headers.get('x-robots-tag') || '', /noindex.*nofollow/i, 'Private route is missing indexing protection');
  assert.match(privateEntry.headers.get('cache-control') || '', /no-store/i, 'Private route is not marked no-store');

  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  assert.ok(!sitemap.includes(env.PRIVATE_ADMIN_LOGIN_PATH), 'Private route leaked into sitemap');
  assert.ok(!robots.includes(env.PRIVATE_ADMIN_LOGIN_PATH), 'Private route leaked into robots.txt');
}

const invalidAppointment = await fetch(`${base}/api/appointments`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
});
assert.equal(invalidAppointment.status, 422, 'Invalid appointment data must be rejected');

let attackChecks = 0;
if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const insert = await anon.from('projects').insert({
    slug: 'security-check-must-not-persist', title_el: 'Έλεγχος ασφαλείας', title_en: 'Security check',
    description_el: 'Αυτή η εγγραφή δεν πρέπει ποτέ να δημιουργηθεί.',
    description_en: 'This record must never be created.', category: 'repair', year: null,
    location_el: null, location_en: null, cover_path: null, featured: false, status: 'draft',
  });
  assert.ok(insert.error, 'Anonymous project INSERT was not denied');
  attackChecks += 1;

  const deletion = await anon.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id');
  assert.equal(deletion.data?.length || 0, 0, 'Anonymous project DELETE returned deleted records');
  attackChecks += 1;

  const upload = await anon.storage.from('project-images').upload(`security-check/${crypto.randomUUID()}.png`, new Blob(['denied'], { type: 'image/png' }), { contentType: 'image/png' });
  assert.ok(upload.error, 'Anonymous Storage upload was not denied');
  attackChecks += 1;

  const appointments = await anon.from('appointment_requests').select('*');
  assert.equal(appointments.data?.length || 0, 0, 'Anonymous visitor read appointment requests');
  attackChecks += 1;

  const memberships = await anon.from('admin_users').select('*');
  assert.equal(memberships.data?.length || 0, 0, 'Anonymous visitor read admin membership');
  attackChecks += 1;

  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const marker = crypto.randomUUID();
    const appointmentEmail = `compliance-${marker}@example.invalid`;
    const userEmail = `non-admin-${marker}@example.invalid`;
    const password = `Test-${crypto.randomUUID()}-9a!`;
    let appointmentId;
    let userId;
    let userClient;

    try {
      const validAppointment = await fetch(`${base}/api/appointments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 200) + 1}` },
        body: JSON.stringify({
          name: 'Compliance Test', phone: '+357 96000000', email: appointmentEmail,
          workType: 'repair', area: 'Nicosia', preferredDate: '', preferredTime: '',
          message: `Automated compliance test ${marker}`, website: '',
        }),
      });
      assert.equal(validAppointment.status, 200, `Valid anonymous appointment submission failed: ${await validAppointment.text()}`);
      attackChecks += 1;

      const saved = await service.from('appointment_requests').select('id,status').eq('email', appointmentEmail).single();
      assert.ifError(saved.error);
      appointmentId = saved.data.id;
      assert.equal(saved.data.status, 'new', 'Appointment submission did not use the safe initial status');

      const anonymousRead = await anon.from('appointment_requests').select('id').eq('id', appointmentId);
      assert.ifError(anonymousRead.error);
      assert.equal(anonymousRead.data?.length || 0, 0, 'Anonymous visitor read the submitted appointment');
      attackChecks += 1;

      const anonymousUpdate = await anon.from('appointment_requests').update({ status: 'completed' }).eq('id', appointmentId).select('id');
      assert.ifError(anonymousUpdate.error);
      assert.equal(anonymousUpdate.data?.length || 0, 0, 'Anonymous visitor updated the submitted appointment');
      attackChecks += 1;

      const created = await service.auth.admin.createUser({ email: userEmail, password, email_confirm: true });
      assert.ifError(created.error);
      userId = created.data.user.id;
      userClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      const signedIn = await userClient.auth.signInWithPassword({ email: userEmail, password });
      assert.ifError(signedIn.error);

      const nonAdminRead = await userClient.from('appointment_requests').select('id').eq('id', appointmentId);
      assert.ifError(nonAdminRead.error);
      assert.equal(nonAdminRead.data?.length || 0, 0, 'Authenticated non-admin read appointment data');
      attackChecks += 1;

      const membership = await service.from('admin_users').insert({ user_id: userId });
      assert.ifError(membership.error);
      const aal1AdminRead = await userClient.from('appointment_requests').select('id').eq('id', appointmentId);
      assert.ifError(aal1AdminRead.error);
      assert.equal(aal1AdminRead.data?.length || 0, 0, 'Admin membership without MFA read appointment data');
      attackChecks += 1;

      const enrollment = await userClient.auth.mfa.enroll({ factorType: 'totp', friendlyName: `smoke-${marker}` });
      assert.ifError(enrollment.error);
      const verified = await userClient.auth.mfa.challengeAndVerify({ factorId: enrollment.data.id, code: currentTotp(enrollment.data.totp.secret) });
      assert.ifError(verified.error);
      const assurance = await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
      assert.ifError(assurance.error);
      assert.equal(assurance.data.currentLevel, 'aal2', 'Temporary admin session did not reach MFA AAL2');

      const mfaAdminRead = await userClient.from('appointment_requests').select('id').eq('id', appointmentId);
      assert.ifError(mfaAdminRead.error);
      assert.equal(mfaAdminRead.data?.length, 1, 'Admin with MFA could not read the submitted appointment');
      attackChecks += 1;

      const contacted = await userClient.from('appointment_requests').update({ status: 'contacted' }).eq('id', appointmentId).select('id,status').single();
      assert.ifError(contacted.error);
      assert.equal(contacted.data.status, 'contacted', 'MFA admin could not move an appointment to contacted');
      const contactedRefresh = await userClient.from('appointment_requests').select('status').eq('id', appointmentId).single();
      assert.ifError(contactedRefresh.error);
      assert.equal(contactedRefresh.data.status, 'contacted', 'Contacted status did not persist after a fresh read');
      attackChecks += 1;

      const completed = await userClient.from('appointment_requests').update({ status: 'completed' }).eq('id', appointmentId).select('id,status').single();
      assert.ifError(completed.error);
      assert.equal(completed.data.status, 'completed', 'MFA admin could not move an appointment to completed');
      const completedRefresh = await userClient.from('appointment_requests').select('status').eq('id', appointmentId).single();
      assert.ifError(completedRefresh.error);
      assert.equal(completedRefresh.data.status, 'completed', 'Completed status did not persist after a fresh read');
      attackChecks += 1;
    } finally {
      if (userClient) await userClient.auth.signOut().catch(() => {});
      if (userId) {
        await service.from('admin_users').delete().eq('user_id', userId);
        await service.auth.admin.deleteUser(userId);
      }
      if (appointmentId) await service.from('appointment_requests').delete().eq('id', appointmentId);
      else await service.from('appointment_requests').delete().eq('email', appointmentEmail);
    }
  }
}

console.log(`Smoke tests passed: ${publicCases.length + 8} route/form/security checks and ${attackChecks} Supabase access-control checks.`);
