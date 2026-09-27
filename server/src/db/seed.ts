import bcrypt from 'bcryptjs';
import { db, client, initDb } from './index.js';
import { users, materials, categories, circles, circleMembers, circleMaterials, announcements, ratings, savedMaterials, downloads, notifications } from './schema.js';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';

export async function seed() {
  await initDb();

  // Check if users already seeded
  const existingUsers = await client.execute('SELECT COUNT(*) as count FROM users');
  const count = Number(existingUsers.rows[0]?.count || 0);
  if (count > 0) {
    console.log('[Seed] Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('[Seed] Seeding academic database...');

  // Ensure uploads directory has real sample files for download and preview
  const uploadDir = config.uploadsDir;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Create real mock academic documents
  const samplePdfPath = path.join(uploadDir, 'dsa-binary-trees.pdf');
  const sampleDocxPath = path.join(uploadDir, 'dbms-normalization-guide.docx');
  const samplePptxPath = path.join(uploadDir, 'os-concurrency-slides.pptx');
  const sampleJavaPdf = path.join(uploadDir, 'java-oop-mastery.pdf');
  const sampleCNotes = path.join(uploadDir, 'c-pointers-memory.pdf');
  const sampleNetPdf = path.join(uploadDir, 'computer-networks-osi.pdf');
  const sampleSecPdf = path.join(uploadDir, 'cyber-security-crypto.pdf');
  const sampleMathPdf = path.join(uploadDir, 'discrete-mathematics-graphs.pdf');

  // Simple valid PDF / text contents for testing download and preview
  const mockPdfContent = `%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 18 Tf 50 700 Td (StudentShare - Academic Material Verified) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000015 00000 n \n0000000068 00000 n \n0000000125 00000 n \n0000000216 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n323\n%%EOF`;

  fs.writeFileSync(samplePdfPath, mockPdfContent);
  fs.writeFileSync(sampleDocxPath, 'PK\x03\x04 StudentShare Academic Document (DOCX)');
  fs.writeFileSync(samplePptxPath, 'PK\x03\x04 StudentShare Academic Presentation (PPTX)');
  fs.writeFileSync(sampleJavaPdf, mockPdfContent);
  fs.writeFileSync(sampleCNotes, mockPdfContent);
  fs.writeFileSync(sampleNetPdf, mockPdfContent);
  fs.writeFileSync(sampleSecPdf, mockPdfContent);
  fs.writeFileSync(sampleMathPdf, mockPdfContent);

  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  const studentPassword = await bcrypt.hash('Student@123456', 10);

  const now = new Date().toISOString();

  // Seed Users
  const userAdmin = {
    id: 'user-admin-001',
    name: 'Academic Dean (Admin)',
    email: 'admin@studentshare.edu',
    passwordHash: adminPassword,
    role: 'ADMIN' as const,
    department: 'Department of Computer Science',
    year: 'Faculty',
    semester: 'Staff',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    bio: 'Platform administrator and faculty coordinator for engineering courseware.',
    isBanned: false,
    createdAt: now,
    updatedAt: now,
  };

  const userRahul = {
    id: 'user-student-001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@studentshare.edu',
    passwordHash: studentPassword,
    role: 'STUDENT' as const,
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    semester: 'Semester 5',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    bio: 'Passionate about Algorithms, Distributed Systems, and Competitive Programming.',
    isBanned: false,
    createdAt: now,
    updatedAt: now,
  };

  const userPriya = {
    id: 'user-student-002',
    name: 'Priya Patel',
    email: 'priya.patel@studentshare.edu',
    passwordHash: studentPassword,
    role: 'STUDENT' as const,
    department: 'Information Technology',
    year: '2nd Year',
    semester: 'Semester 4',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    bio: 'Database geek and cybersecurity enthusiast. Sharing high-yield exam summaries.',
    isBanned: false,
    createdAt: now,
    updatedAt: now,
  };

  const userAlex = {
    id: 'user-student-003',
    name: 'Alex Chen',
    email: 'alex.chen@studentshare.edu',
    passwordHash: studentPassword,
    role: 'STUDENT' as const,
    department: 'Electronics & Communication',
    year: '3rd Year',
    semester: 'Semester 6',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    bio: 'Hardware and systems lover. Working on IoT and Computer Architecture.',
    isBanned: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(users).values([userAdmin, userRahul, userPriya, userAlex]);

  // Seed Categories
  const sampleCategories = [
    { id: 'cat-1', name: 'Computer Science & Engineering', code: 'CSE', description: 'Core and elective computer engineering curricula', icon: 'Code' },
    { id: 'cat-2', name: 'Information Technology', code: 'IT', description: 'Cloud, software, network and information systems', icon: 'Cpu' },
    { id: 'cat-3', name: 'Electronics & Communication', code: 'ECE', description: 'Signals, microprocessors, embedded systems', icon: 'Radio' },
    { id: 'cat-4', name: 'Applied Mathematics', code: 'MATH', description: 'Discrete mathematics, linear algebra, statistics', icon: 'Binary' },
    { id: 'cat-5', name: 'Cyber Security', code: 'CYBER', description: 'Cryptography, network defense, penetration testing', icon: 'Shield' },
  ];
  await db.insert(categories).values(sampleCategories);

  // Seed Materials
  const sampleMaterials = [
    {
      id: 'mat-001',
      title: 'Complete Binary Trees, AVL & Red-Black Trees Comprehensive Guide',
      subject: 'Data Structures',
      topic: 'Self-Balancing Trees & Heaps',
      description: 'In-depth handwritten notes with visual step-by-step tree rotations, asymptotic proofs, and C++ code implementations.',
      tags: 'Data Structures, Trees, AVL, Red-Black, C++, Algorithms',
      department: 'Computer Science & Engineering',
      year: '2nd Year',
      semester: 'Semester 3',
      unit: 'Unit 3',
      materialType: 'Notes',
      filePath: 'dsa-binary-trees.pdf',
      fileName: 'dsa-binary-trees.pdf',
      fileSize: 4200150,
      fileType: 'pdf',
      uploaderId: userRahul.id,
      downloadCount: 142,
      viewCount: 680,
      averageRating: 4.8,
      ratingCount: 24,
      isApproved: true,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'mat-002',
      title: 'Database Normalization Masterclass: 1NF to BCNF with Solved Examples',
      subject: 'DBMS',
      topic: 'Relational Schema Design & Functional Dependencies',
      description: 'Exam-focused tutorial clarifying Armstrong axioms, minimal cover algorithm, lossless join and dependency preservation.',
      tags: 'DBMS, Normalization, BCNF, 3NF, SQL, Relational Design',
      department: 'Information Technology',
      year: '2nd Year',
      semester: 'Semester 4',
      unit: 'Unit 2',
      materialType: 'Question Bank',
      filePath: 'dbms-normalization-guide.docx',
      fileName: 'dbms-normalization-guide.docx',
      fileSize: 1850400,
      fileType: 'docx',
      uploaderId: userPriya.id,
      downloadCount: 98,
      viewCount: 420,
      averageRating: 4.9,
      ratingCount: 18,
      isApproved: true,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'mat-003',
      title: 'Operating Systems: Process Synchronization, Semaphores & Deadlocks',
      subject: 'Operating Systems',
      topic: 'Concurrency & Deadlock Avoidance',
      description: 'Lecture slides covering Peterson algorithm, semaphores, classic synchronization problems (Dining Philosophers) and Banker algorithm.',
      tags: 'Operating Systems, Concurrency, Semaphores, Deadlocks, Banker Algorithm',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      semester: 'Semester 5',
      unit: 'Unit 2',
      materialType: 'Presentation',
      filePath: 'os-concurrency-slides.pptx',
      fileName: 'os-concurrency-slides.pptx',
      fileSize: 5600200,
      fileType: 'pptx',
      uploaderId: userRahul.id,
      downloadCount: 215,
      viewCount: 910,
      averageRating: 4.7,
      ratingCount: 35,
      isApproved: true,
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'mat-004',
      title: 'Object-Oriented Programming with Java: Collections & Streams API',
      subject: 'Java',
      topic: 'Java Collections Framework & Lambda Streams',
      description: 'Comprehensive cheat sheet for List, Set, Map hierarchies, hashing internals, and functional programming stream pipelines.',
      tags: 'Java, OOP, Collections, Streams, Lambda, Generics',
      department: 'Computer Science & Engineering',
      year: '2nd Year',
      semester: 'Semester 3',
      unit: 'Unit 4',
      materialType: 'Cheat Sheet',
      filePath: 'java-oop-mastery.pdf',
      fileName: 'java-oop-mastery.pdf',
      fileSize: 2980000,
      fileType: 'pdf',
      uploaderId: userRahul.id,
      downloadCount: 88,
      viewCount: 330,
      averageRating: 4.6,
      ratingCount: 15,
      isApproved: true,
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'mat-005',
      title: 'C Programming: Pointers, Memory Allocation & Struct Layouts',
      subject: 'C Programming',
      topic: 'Dynamic Memory & Struct Padding',
      description: 'Deep dive into malloc/calloc/free, pointer arithmetic, void pointers, function pointers, and bitfields with memory diagrams.',
      tags: 'C Programming, Pointers, Memory, Structs, malloc, C99',
      department: 'Computer Science & Engineering',
      year: '1st Year',
      semester: 'Semester 1',
      unit: 'Unit 3',
      materialType: 'Notes',
      filePath: 'c-pointers-memory.pdf',
      fileName: 'c-pointers-memory.pdf',
      fileSize: 3100500,
      fileType: 'pdf',
      uploaderId: userPriya.id,
      downloadCount: 160,
      viewCount: 750,
      averageRating: 4.8,
      ratingCount: 28,
      isApproved: true,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'mat-006',
      title: 'Computer Networks: OSI 7-Layer Architecture & TCP/IP Flow Control',
      subject: 'Computer Networks',
      topic: 'Network Layers, TCP Handshake & Subnetting',
      description: 'Visual diagrams of TCP 3-way handshake, sliding window protocols (Go-Back-N, Selective Repeat), and CIDR IPv4 subnetting practice questions.',
      tags: 'Computer Networks, TCP, UDP, OSI, Subnetting, Routing',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      semester: 'Semester 5',
      unit: 'Unit 1',
      materialType: 'Notes',
      filePath: 'computer-networks-osi.pdf',
      fileName: 'computer-networks-osi.pdf',
      fileSize: 4500000,
      fileType: 'pdf',
      uploaderId: userAlex.id,
      downloadCount: 130,
      viewCount: 520,
      averageRating: 4.5,
      ratingCount: 19,
      isApproved: true,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'mat-007',
      title: 'Cyber Security: Public Key Cryptography, RSA & Diffie-Hellman',
      subject: 'Cyber Security',
      topic: 'Asymmetric Cryptography & Digital Signatures',
      description: 'Mathematical proofs and solved numerical examples for RSA encryption/decryption, SHA-256 hashing, and man-in-the-middle mitigations.',
      tags: 'Cyber Security, Cryptography, RSA, Diffie-Hellman, SHA-256',
      department: 'Information Technology',
      year: '3rd Year',
      semester: 'Semester 6',
      unit: 'Unit 2',
      materialType: 'Lab Manual',
      filePath: 'cyber-security-crypto.pdf',
      fileName: 'cyber-security-crypto.pdf',
      fileSize: 3800000,
      fileType: 'pdf',
      uploaderId: userPriya.id,
      downloadCount: 175,
      viewCount: 610,
      averageRating: 4.9,
      ratingCount: 30,
      isApproved: true,
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'mat-008',
      title: 'Discrete Mathematics: Graph Theory & Recurrence Relations',
      subject: 'Mathematics',
      topic: 'Eulerian Graphs, Trees & Master Theorem',
      description: 'Solved university question papers on planar graphs, chromatic numbers, pigeonhole principle, and generating functions.',
      tags: 'Mathematics, Graph Theory, Master Theorem, Recurrence, Discrete',
      department: 'Applied Mathematics',
      year: '1st Year',
      semester: 'Semester 2',
      unit: 'Unit 4',
      materialType: 'Question Bank',
      filePath: 'discrete-mathematics-graphs.pdf',
      fileName: 'discrete-mathematics-graphs.pdf',
      fileSize: 4120000,
      fileType: 'pdf',
      uploaderId: userRahul.id,
      downloadCount: 205,
      viewCount: 890,
      averageRating: 4.7,
      ratingCount: 22,
      isApproved: true,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: now,
    },
  ];

  await db.insert(materials).values(sampleMaterials);

  // Seed Saved Materials
  await db.insert(savedMaterials).values([
    { id: 'save-1', userId: userRahul.id, materialId: 'mat-002', createdAt: now },
    { id: 'save-2', userId: userRahul.id, materialId: 'mat-007', createdAt: now },
    { id: 'save-3', userId: userPriya.id, materialId: 'mat-001', createdAt: now },
    { id: 'save-4', userId: userPriya.id, materialId: 'mat-003', createdAt: now },
  ]);

  // Seed Downloads
  await db.insert(downloads).values([
    { id: 'dl-1', userId: userRahul.id, materialId: 'mat-002', downloadedAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'dl-2', userId: userRahul.id, materialId: 'mat-007', downloadedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'dl-3', userId: userPriya.id, materialId: 'mat-001', downloadedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  ]);

  // Seed Ratings
  await db.insert(ratings).values([
    { id: 'rate-1', userId: userRahul.id, materialId: 'mat-002', rating: 5, review: 'Crystal clear normalization step-by-step breakdown! Helped me ace midterms.', createdAt: now, updatedAt: now },
    { id: 'rate-2', userId: userPriya.id, materialId: 'mat-001', rating: 5, review: 'Best AVL tree rotation diagrams I have ever seen.', createdAt: now, updatedAt: now },
    { id: 'rate-3', userId: userAlex.id, materialId: 'mat-003', rating: 4, review: 'Great slides on Banker algorithm and deadlocks.', createdAt: now, updatedAt: now },
  ]);

  // Seed Friend Circles
  const circlePassword = await bcrypt.hash('StudySquad2026', 10);
  const circleDsa = {
    id: 'circle-dsa-squad',
    name: 'DSA Masters & LeetCode Squad',
    description: 'Private circle for peer study on advanced algorithms, graphs, dynamic programming, and mock coding interviews.',
    passwordHash: circlePassword,
    ownerId: userRahul.id,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: now,
  };

  const circleDbms = {
    id: 'circle-dbms-pros',
    name: 'DBMS & Systems Explorers',
    description: 'Collaborative group discussing storage engines, ACID internals, and query optimization.',
    passwordHash: circlePassword,
    ownerId: userPriya.id,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: now,
  };

  await db.insert(circles).values([circleDsa, circleDbms]);

  // Seed Circle Members
  await db.insert(circleMembers).values([
    { id: 'cm-1', circleId: circleDsa.id, userId: userRahul.id, role: 'OWNER' as const, joinedAt: circleDsa.createdAt },
    { id: 'cm-2', circleId: circleDsa.id, userId: userPriya.id, role: 'MEMBER' as const, joinedAt: now },
    { id: 'cm-3', circleId: circleDbms.id, userId: userPriya.id, role: 'OWNER' as const, joinedAt: circleDbms.createdAt },
    { id: 'cm-4', circleId: circleDbms.id, userId: userAlex.id, role: 'MEMBER' as const, joinedAt: now },
  ]);

  // Seed Circle Materials
  await db.insert(circleMaterials).values([
    { id: 'cm-mat-1', circleId: circleDsa.id, materialId: 'mat-001', sharedBy: userRahul.id, createdAt: now },
    { id: 'cm-mat-2', circleId: circleDbms.id, materialId: 'mat-002', sharedBy: userPriya.id, createdAt: now },
  ]);

  // Seed Circle Announcements
  await db.insert(announcements).values([
    {
      id: 'ann-1',
      circleId: circleDsa.id,
      authorId: userRahul.id,
      title: 'Weekly Mock Coding Round on Graphs & Disjoint Sets',
      content: 'Hey everyone, our weekly mock test is scheduled for Saturday at 6 PM. Review BFS/DFS and Kruskal algorithm before joining!',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'ann-2',
      circleId: circleDbms.id,
      authorId: userPriya.id,
      title: 'Midterm Schema Design Review Session',
      content: 'I have uploaded the solved questions for BCNF decomposition. Check out the materials section.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  // Seed Notifications
  await db.insert(notifications).values([
    {
      id: 'notif-1',
      userId: userRahul.id,
      type: 'MATERIAL_UPLOAD',
      title: 'New High-Rated Material Available',
      message: 'Priya Patel uploaded "Database Normalization Masterclass: 1NF to BCNF"',
      link: '/materials/mat-002',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'notif-2',
      userId: userRahul.id,
      type: 'CIRCLE_ANNOUNCEMENT',
      title: 'New Announcement in DSA Masters Squad',
      message: 'Weekly Mock Coding Round on Graphs & Disjoint Sets has been scheduled.',
      link: '/circles/circle-dsa-squad',
      isRead: true,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'notif-3',
      userId: userPriya.id,
      type: 'SYSTEM',
      title: 'Welcome to StudentShare!',
      message: 'Explore vetted study materials, create Friend Circles, and collaborate with your peers.',
      link: '/materials',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  console.log('[Seed] Database seeding completed successfully.');
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  seed().then(() => {
    console.log('[Seed] Done.');
    process.exit(0);
  }).catch((err) => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  });
}
