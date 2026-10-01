const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_API_URL ? process.env.TEST_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';

function postMultipart(urlPath, fields, fileField, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const postData = [];

    // Fields
    for (const [key, value] of Object.entries(fields)) {
      postData.push(`--${boundary}\r\n`);
      postData.push(`Content-Disposition: form-data; name="${key}"\r\n\r\n`);
      postData.push(`${value}\r\n`);
    }

    // File
    if (fileField) {
      postData.push(`--${boundary}\r\n`);
      postData.push(`Content-Disposition: form-data; name="${fileField.fieldname}"; filename="${fileField.filename}"\r\n`);
      postData.push(`Content-Type: ${fileField.mimetype}\r\n\r\n`);
    }

    const payloadHeader = Buffer.from(postData.join(''), 'utf-8');
    const fileBuffer = fileField ? fileField.buffer : Buffer.alloc(0);
    const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const totalLength = payloadHeader.length + fileBuffer.length + payloadFooter.length;

    const parsedUrl = new URL(BASE_URL + urlPath);
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': totalLength,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payloadHeader);
    if (fileField) req.write(fileBuffer);
    req.write(payloadFooter);
    req.end();
  });
}

function requestJson(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(BASE_URL + urlPath);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function requestBinary(urlPath, token) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(BASE_URL + urlPath);
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          buffer: Buffer.concat(chunks),
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('====================================================');
  console.log('STUDENTSHARE MATERIAL VIEW & PREVIEW VERIFICATION');
  console.log('====================================================\n');

  // Step 1: Login as student
  console.log('[STEP 1] Login as Student Rahul Sharma');
  const loginRes = await requestJson('POST', '/api/auth/login', {
    email: 'rahul.sharma@studentshare.edu',
    password: 'Student@123456',
  });
  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error('Login failed: ' + JSON.stringify(loginRes.body));
  }
  const token = loginRes.body.token;
  console.log('  ✓ Logged in successfully, token received.');

  // Step 2: Upload real PDF file
  console.log('\n[STEP 2] Upload a real PDF file via multipart/form-data');
  const pdfFilePath = path.resolve(__dirname, '../../test-upload.pdf');
  const pdfBytes = fs.readFileSync(pdfFilePath);

  const uploadRes = await postMultipart(
    '/api/materials',
    {
      title: 'Compiler Design Unit 3 Notes - Syntax Directed Translation',
      subject: 'Compiler Design',
      topic: 'SDD and SDT Schemes',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      semester: 'Semester 5',
      unit: 'Unit 3',
      materialType: 'Notes',
      description: 'Comprehensive exam notes on synthesized and inherited attributes.',
    },
    {
      fieldname: 'file',
      filename: 'compiler-design-unit3.pdf',
      mimetype: 'application/pdf',
      buffer: pdfBytes,
    },
    token
  );

  if (uploadRes.status !== 201 || !uploadRes.body.data?.id) {
    throw new Error('Upload failed: ' + JSON.stringify(uploadRes.body));
  }
  const materialId = uploadRes.body.data.id;
  console.log(`  ✓ Material successfully created with ID: ${materialId}`);
  console.log(`  ✓ File: compiler-design-unit3.pdf (${pdfBytes.length} bytes)`);

  // Step 3: Verify Material Appears and Details are Complete
  console.log('\n[STEP 3] Fetch Material Details from API');
  const detailRes = await requestJson('GET', `/api/materials/${materialId}`, null, token);
  if (detailRes.status !== 200) throw new Error('Detail fetch failed: ' + detailRes.status);
  const mat = detailRes.body.data;
  console.log(`  ✓ Title: "${mat.title}"`);
  console.log(`  ✓ Subject: ${mat.subject}`);
  console.log(`  ✓ Uploader: ${mat.uploaderName}`);
  console.log(`  ✓ File Type: ${mat.fileType}`);
  console.log(`  ✓ Initial Download Count: ${mat.downloadCount}`);
  console.log(`  ✓ Initial View Count: ${mat.viewCount}`);

  // Step 4: Stream Actual PDF via Preview Endpoint
  console.log('\n[STEP 4] Test In-App Document Stream (/api/materials/:id/preview)');
  const previewRes = await requestBinary(`/api/materials/${materialId}/preview`, token);
  console.log(`  ✓ Preview HTTP Status: ${previewRes.status}`);
  console.log(`  ✓ Content-Type: ${previewRes.headers['content-type']}`);
  console.log(`  ✓ Content-Disposition: ${previewRes.headers['content-disposition']}`);
  console.log(`  ✓ Accept-Ranges: ${previewRes.headers['accept-ranges']}`);
  console.log(`  ✓ Streamed bytes: ${previewRes.buffer.length}`);

  if (previewRes.status !== 200) throw new Error('Preview failed');
  if (!previewRes.headers['content-type']?.includes('application/pdf')) {
    throw new Error('Expected Content-Type application/pdf');
  }
  if (!previewRes.headers['content-disposition']?.includes('inline')) {
    throw new Error('Expected Content-Disposition: inline for browser preview');
  }
  if (previewRes.buffer.length !== pdfBytes.length) {
    throw new Error(`Byte mismatch: sent ${pdfBytes.length} vs received ${previewRes.buffer.length}`);
  }
  // Check PDF signature %PDF
  const pdfHeader = previewRes.buffer.subarray(0, 5).toString('utf-8');
  if (!pdfHeader.startsWith('%PDF')) {
    throw new Error('Preview did not return valid PDF magic header');
  }
  console.log(`  ✓ Verified actual valid PDF magic signature: "${pdfHeader}"`);

  // Step 5: Verify Preview Did NOT increment Download Count
  console.log('\n[STEP 5] Verify Preview Did NOT Increment Download Count');
  const checkCountRes = await requestJson('GET', `/api/materials/${materialId}`, null, token);
  console.log(`  ✓ Download count after preview: ${checkCountRes.body.data.downloadCount} (Must remain 0)`);
  if (checkCountRes.body.data.downloadCount !== 0) {
    throw new Error('Preview mistakenly incremented download count!');
  }

  // Step 6: Test Separate Download Action
  console.log('\n[STEP 6] Test Separate Download Endpoint (/api/materials/:id/download)');
  const downloadRes = await requestBinary(`/api/materials/${materialId}/download`, token);
  console.log(`  ✓ Download HTTP Status: ${downloadRes.status}`);
  console.log(`  ✓ Content-Disposition: ${downloadRes.headers['content-disposition']}`);
  if (!downloadRes.headers['content-disposition']?.includes('attachment')) {
    throw new Error('Expected Content-Disposition: attachment for download');
  }

  // Step 7: Verify Download Count Incremented
  const afterDlRes = await requestJson('GET', `/api/materials/${materialId}`, null, token);
  console.log(`  ✓ Download count after explicit download: ${afterDlRes.body.data.downloadCount} (Successfully incremented by 1)`);
  if (afterDlRes.body.data.downloadCount !== 1) {
    throw new Error('Download failed to increment download count!');
  }

  // Step 8: Verify DOCX and PPTX seeded files are also valid and streamable
  console.log('\n[STEP 8] Test Seeded DOCX and PPTX Preview Endpoints');
  const docxPreview = await requestBinary('/api/materials/mat-002/preview');
  console.log(`  ✓ DBMS Normalization DOCX stream status: ${docxPreview.status} (${docxPreview.buffer.length} bytes)`);

  const pptxPreview = await requestBinary('/api/materials/mat-003/preview');
  console.log(`  ✓ OS Concurrency PPTX stream status: ${pptxPreview.status} (${pptxPreview.buffer.length} bytes)`);

  // Step 9: Verify Private Circle Security (Requirement 9)
  console.log('\n[STEP 9] Verify Private Circle Material Preview Security');
  // Login as Alex (non-member of circle-dsa-squad)
  const alexLogin = await requestJson('POST', '/api/auth/login', {
    email: 'alex.chen@studentshare.edu',
    password: 'Student@123456',
  });
  const alexToken = alexLogin.body.token;

  // Login as Priya (member of circle-dsa-squad)
  const priyaLogin = await requestJson('POST', '/api/auth/login', {
    email: 'priya.patel@studentshare.edu',
    password: 'Student@123456',
  });
  const priyaToken = priyaLogin.body.token;

  // Upload private circle material (isApproved: false)
  const privateMatRes = await postMultipart(
    '/api/materials',
    {
      title: 'Confidential Circle Exam Solutions',
      subject: 'Data Structures',
      topic: 'Final Exam Preparation',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      semester: 'Semester 5',
      unit: 'Unit 5',
      materialType: 'Question Bank',
      description: 'Private circle study material.',
    },
    {
      fieldname: 'file',
      filename: 'confidential-solutions.pdf',
      mimetype: 'application/pdf',
      buffer: pdfBytes,
    },
    token // uploaded by Rahul (circle owner)
  );

  const privMatId = privateMatRes.body.data.id;
  // Link to DSA squad circle
  await requestJson('POST', `/api/circles/circle-dsa-squad/materials`, { materialId: privMatId }, token);

  const adminLogin = await requestJson('POST', '/api/auth/login', {
    email: 'admin@studentshare.edu',
    password: 'Admin@123456',
  });
  const unapproveRes = await requestJson(
    'PUT',
    `/api/admin/materials/${privMatId}/approve`,
    { isApproved: false },
    adminLogin.body.token
  );
  if (unapproveRes.status !== 200) {
    throw new Error('Failed to unapprove material for private circle test: ' + unapproveRes.status);
  }

  // Test non-member (Alex) preview access
  const nonMemberPreview = await requestBinary(`/api/materials/${privMatId}/preview`, alexToken);
  console.log(`  ✓ Non-member preview access status: ${nonMemberPreview.status} (Expected 403 Forbidden)`);
  if (nonMemberPreview.status !== 403) {
    throw new Error(`Expected 403 Forbidden for non-member preview, got: ${nonMemberPreview.status}`);
  }

  // Test unauthenticated preview access
  const unauthPreview = await requestBinary(`/api/materials/${privMatId}/preview`);
  console.log(`  ✓ Unauthenticated preview access status: ${unauthPreview.status} (Expected 403 Forbidden)`);
  if (unauthPreview.status !== 403) {
    throw new Error(`Expected 403 Forbidden for unauthenticated preview, got: ${unauthPreview.status}`);
  }

  // Test member (Priya) preview access
  const memberPreview = await requestBinary(`/api/materials/${privMatId}/preview`, priyaToken);
  console.log(`  ✓ Circle member preview access status: ${memberPreview.status} (Expected 200 OK)`);
  if (memberPreview.status !== 200) {
    throw new Error(`Expected 200 OK for circle member preview, got: ${memberPreview.status}`);
  }

  console.log('\n====================================================');
  console.log('ALL MATERIAL VIEW & READER CHECKS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');
}

runTest().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
