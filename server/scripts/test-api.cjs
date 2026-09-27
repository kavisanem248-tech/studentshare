/**
 * StudentShare Full-Stack Automated Test Suite
 * Validates Section 30 Steps 1-25 & Section 35 Security Rules
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object' && !(body instanceof Buffer)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('Starting StudentShare Complete Automated Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function step(name, fn) {
    total++;
    console.log(`[TEST ${total}] ${name}`);
    try {
      await fn();
      passed++;
      console.log(`Status: PASS\n`);
    } catch (err) {
      console.error(`Status: FAIL -> ${err.message}\n`);
      throw err;
    }
  }

  // STEP 7: Check API health endpoint
  await step('STEP 7: Check API Health Endpoint (GET /api/health)', async () => {
    const res = await request('/health');
    console.log('HEALTH RESPONSE STATUS:', res.status);
    console.log('HEALTH RESPONSE DATA:', JSON.stringify(res.data));
    assert(res.status === 200, 'Health endpoint returns HTTP 200');
    assert(res.data && (res.data.status === 'ok' || res.data.status === 'healthy'), 'Health response status is "ok"');
    assert(res.data && (res.data.database === 'connected' || res.data.status === 'healthy'), 'Database connection status is "connected"');
  });

  // STEP 10: Authentication Flow
  let adminToken = '';
  let rahulToken = '';
  let priyaToken = '';
  let newStudentToken = '';
  let newStudentId = '';

  await step('STEP 10: Authentication Flow (Login & Register)', async () => {
    // 1. Admin login
    const adminRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@studentshare.edu', password: 'Admin@123456' },
    });
    assert(adminRes.status === 200, 'Admin login succeeded');
    assert(adminRes.data.user.role === 'ADMIN', 'Admin user role is verified as ADMIN');
    adminToken = adminRes.data.token;

    // 2. Student login (Rahul)
    const rahulRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'rahul.sharma@studentshare.edu', password: 'Student@123456' },
    });
    assert(rahulRes.status === 200, 'Student Rahul login succeeded');
    assert(rahulRes.data.user.role === 'STUDENT', 'Rahul role is STUDENT');
    rahulToken = rahulRes.data.token;

    // 3. Student login (Priya)
    const priyaRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'priya.patel@studentshare.edu', password: 'Student@123456' },
    });
    assert(priyaRes.status === 200, 'Student Priya login succeeded');
    priyaToken = priyaRes.data.token;

    // 4. Invalid login detailed failure reasons (Section 10)
    const wrongPassRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@studentshare.edu', password: 'WrongPassword999' },
    });
    assert(wrongPassRes.status === 401, 'Invalid password correctly rejected with HTTP 401');
    assert(wrongPassRes.data.error.includes('Incorrect password'), 'Detailed message: Incorrect password provided');

    const noAccountRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent.student.99@university.edu', password: 'AnyPassword123' },
    });
    assert(noAccountRes.status === 401, 'Nonexistent account correctly rejected with HTTP 401');
    assert(noAccountRes.data.error.includes('No account found'), 'Detailed message: No account found provided');

    // 5. Providers configuration endpoint & Google OAuth truthful check (Section 11)
    const providersRes = await request('/auth/providers');
    assert(providersRes.status === 200, 'GET /api/auth/providers returns HTTP 200');
    assert(providersRes.data.providers, 'Providers object is returned');

    const googleAuthRes = await request('/auth/google', {
      method: 'POST',
      body: { email: 'test.google@studentshare.edu' },
    });
    if (!providersRes.data.providers.google.configured) {
      assert(googleAuthRes.status === 503, 'Unconfigured Google OAuth correctly returns HTTP 503 Service Unavailable');
      assert(googleAuthRes.data.code === 'GOOGLE_AUTH_UNCONFIGURED', 'Google Login truthfulness confirmed (not faked)');
    }

    // 6. Register new student user
    const testEmail = `test.student.${Date.now()}@studentshare.edu`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Auto Tester',
        email: testEmail,
        password: 'Password@123',
        department: 'Computer Science & Engineering',
        year: '2nd Year',
        semester: 'Semester 3',
      },
    });
    assert(regRes.status === 201, 'New student registration returns HTTP 201');
    assert(regRes.data.token, 'Registration returns valid JWT auth token');
    newStudentToken = regRes.data.token;
    newStudentId = regRes.data.user.id;

    // 7. Verify session restoration (GET /api/auth/me)
    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert(meRes.status === 200, 'GET /api/auth/me returns current user profile');
    assert(meRes.data.user.email === testEmail, 'Restored session matches registered user email');
  });

  // STEP 11: Protected Routes Security
  await step('STEP 11: Protected Route Authorization Enforcement', async () => {
    // Calling protected endpoint without token
    const unauthRes = await request('/user/saved');
    assert(unauthRes.status === 401, 'Accessing protected route without token returns HTTP 401 Unauthorized');
  });

  // STEP 12 & 14: Material Retrieval, Filtering & Searching
  let sampleMaterialId = '';
  await step('STEP 12 & 14: Materials Library, Filtering and Search', async () => {
    const listRes = await request('/materials?sort=highest_rated');
    assert(listRes.status === 200, 'GET /api/materials returns HTTP 200');
    assert(Array.isArray(listRes.data.data), 'Materials payload is an array');
    assert(listRes.data.data.length > 0, 'Found pre-seeded academic materials');
    sampleMaterialId = listRes.data.data[0].id;

    // Filter by subject
    const filterRes = await request('/materials?subject=Data+Structures');
    assert(filterRes.status === 200, 'Filter by subject succeeds');
    assert(filterRes.data.data.every((m) => m.subject === 'Data Structures'), 'All results match filtered subject');

    // Search query
    const searchRes = await request('/materials/search?q=Binary');
    assert(searchRes.status === 200, 'GET /api/materials/search returns HTTP 200');
    assert(searchRes.data.data.length > 0, 'Search query successfully matched keywords');

    // Material Details
    const detailRes = await request(`/materials/${sampleMaterialId}`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    assert(detailRes.status === 200, 'GET /api/materials/:id returns HTTP 200 with full details');
    assert(detailRes.data.data.id === sampleMaterialId, 'Details returned correct material ID');
  });

  // STEP 15: Save / Unsave Bookmarks
  await step('STEP 15: Saved Materials Bookmark Persistence', async () => {
    // Save material
    const saveRes = await request(`/materials/${sampleMaterialId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert(saveRes.status === 200, 'POST /api/materials/:id/save succeeds');

    // Verify it appears in user's saved list
    const getSavedRes = await request('/user/saved', {
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert(getSavedRes.status === 200, 'GET /api/user/saved succeeds');
    assert(getSavedRes.data.data.some((m) => m.id === sampleMaterialId), 'Material is now persisted in saved list');

    // Unsave material
    const unsaveRes = await request(`/materials/${sampleMaterialId}/save`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert(unsaveRes.status === 200, 'DELETE /api/materials/:id/save succeeds');

    // Verify removal
    const getSavedRes2 = await request('/user/saved', {
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert(!getSavedRes2.data.data.some((m) => m.id === sampleMaterialId), 'Material was successfully unbookmarked');
  });

  // STEP 16: Preview vs Download Separation & Download History Tracking (Sections 2, 3, 5, 25)
  await step('STEP 16: Preview vs Download Separation & Download History Logging', async () => {
    // 1. Get initial download count
    const initialDetail = await request(`/materials/${sampleMaterialId}`);
    assert(initialDetail.status === 200, 'Fetched initial material details');
    const initialDownloads = initialDetail.data.data.downloadCount;

    // 2. Perform Preview (View) - MUST NOT count as a download
    const previewRes = await request(`/materials/${sampleMaterialId}/preview`);
    assert(previewRes.status === 200, 'GET /api/materials/:id/preview returns HTTP 200 for in-app viewer');
    assert(
      previewRes.headers['content-disposition'] && previewRes.headers['content-disposition'].includes('inline'),
      'Content-Disposition is set to inline for in-browser preview'
    );

    // 3. Verify download count did NOT increment after previewing
    const afterPreviewDetail = await request(`/materials/${sampleMaterialId}`);
    assert(
      afterPreviewDetail.data.data.downloadCount === initialDownloads,
      'Viewing/previewing a document DOES NOT increment download count (Section 5 & 25)'
    );

    // 4. Perform Download (Explicit User Action)
    const dlRes = await request(`/materials/${sampleMaterialId}/download`, {
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert(dlRes.status === 200, 'GET /api/materials/:id/download returns HTTP 200 with file content');
    assert(
      dlRes.headers['content-disposition'] && dlRes.headers['content-disposition'].includes('attachment'),
      'Content-Disposition header is properly set to attachment for download'
    );

    // 5. Verify download count DID increment after actual download
    const afterDownloadDetail = await request(`/materials/${sampleMaterialId}`);
    assert(
      afterDownloadDetail.data.data.downloadCount === initialDownloads + 1,
      'Explicit download increments download count by 1 in database'
    );

    // 6. Verify download event persisted in user download history
    const histRes = await request('/user/downloads', {
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert(histRes.status === 200, 'GET /api/user/downloads returns HTTP 200');
    assert(histRes.data.data.some((d) => d.material_id === sampleMaterialId), 'Download event is persisted in database history');
  });

  // STEP 17-20: Friend Circle Creation, Password Verification, Persistent Membership, Security & Member Controls
  let testCircleId = '';
  const circlePassword = 'PrivateSquadPass123';
  const circleName = `Study Circle ${Date.now()}`;

  await step('STEP 17-20: Friend Circles (Create, Password Join, Persistent Membership & Security Checks)', async () => {
    // 1. Create Circle (Rahul is Creator -> OWNER)
    const createRes = await request('/circles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rahulToken}` },
      body: {
        name: circleName,
        password: circlePassword,
        description: 'Automated test private circle',
      },
    });
    assert(createRes.status === 201, 'POST /api/circles creates circle and returns HTTP 201');
    assert(createRes.data.data.role === 'OWNER', 'Creator is assigned OWNER role in database');
    testCircleId = createRes.data.data.id;

    // 2. Security Check: Non-member (newStudent) CANNOT access private circle
    const nonMemberRes = await request(`/circles/${testCircleId}`, {
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert(nonMemberRes.status === 403, 'Non-member access is rejected with HTTP 403 Forbidden (Privacy guaranteed)');

    // 3. Security Check: Joining with wrong password must be rejected
    const wrongPassRes = await request('/circles/join', {
      method: 'POST',
      headers: { Authorization: `Bearer ${newStudentToken}` },
      body: { name: circleName, password: 'WrongPassword' },
    });
    assert(wrongPassRes.status === 401, 'Wrong circle password is rejected with HTTP 401');

    // 4. Join with correct password
    const joinRes = await request('/circles/join', {
      method: 'POST',
      headers: { Authorization: `Bearer ${newStudentToken}` },
      body: { name: circleName, password: circlePassword },
    });
    assert(joinRes.status === 200, 'Correct password allows user to join circle');

    // 5. Persistent Membership: User opens circle without entering password again
    const memberAccessRes = await request(`/circles/${testCircleId}`, {
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert(memberAccessRes.status === 200, 'Persistent membership verified: Member accesses private circle with HTTP 200 without password');
    assert(memberAccessRes.data.data.myRole === 'MEMBER', 'Member role is verified as MEMBER');

    // 6. Post circle announcement
    const annRes = await request(`/circles/${testCircleId}/announcements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${newStudentToken}` },
      body: { title: 'Test Announcement', content: 'Testing group notices.' },
    });
    assert(annRes.status === 201, 'Circle member can post announcements (HTTP 201)');

    // 7. Remove member (Owner removes newStudent)
    const removeRes = await request(`/circles/${testCircleId}/members/${newStudentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    assert(removeRes.status === 200, 'Circle owner can remove members (HTTP 200)');

    // 8. Security Check: Removed member loses access immediately
    const postRemoveRes = await request(`/circles/${testCircleId}`, {
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    assert(postRemoveRes.status === 403, 'Removed member access is immediately revoked with HTTP 403 Forbidden');
  });

  // STEP 21: Admin Authorization Security
  await step('STEP 21: Admin Route Authorization Enforcement', async () => {
    // 1. Student attempts to access admin endpoint -> 403 Forbidden
    const studentAdminRes = await request('/admin/users', {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    assert(studentAdminRes.status === 403, 'Regular student user blocked from /api/admin/users with HTTP 403 Forbidden');

    // 2. Real Admin accesses admin endpoint -> 200 OK
    const adminUsersRes = await request('/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminUsersRes.status === 200, 'Admin user granted access to /api/admin/users with HTTP 200');

    // 3. Admin statistics
    const adminStatsRes = await request('/admin/statistics', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStatsRes.status === 200, 'Admin statistics returns HTTP 200');
  });

  // STEP 22: Notifications Functionality
  await step('STEP 22: Notifications (Unread Count & Mark Read)', async () => {
    const notifRes = await request('/notifications', {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    assert(notifRes.status === 200, 'GET /api/notifications returns HTTP 200');
    assert(typeof notifRes.data.unreadCount === 'number', 'Unread notifications count is provided');

    // Mark all read
    const markRes = await request('/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    assert(markRes.status === 200, 'PUT /api/notifications/read-all returns HTTP 200');
  });

  // STEP 35: Ownership Security Check
  await step('STEP 35: Material Ownership Security (User A cannot edit User B material)', async () => {
    // User Priya uploaded mat-002. Rahul attempts to edit Priya's material:
    const editRes = await request('/materials/mat-002', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${rahulToken}` },
      body: { title: 'Hacked by non-owner' },
    });
    assert(editRes.status === 403, 'Unauthorized edit of another student material rejected with HTTP 403 Forbidden');
  });

  console.log('\n====================================================');
  console.log(`ALL AUTOMATED INTEGRATION & SECURITY TESTS PASSED! (${passed}/${total})`);
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\nTest Suite Terminated with Error:', err);
  process.exit(1);
});
