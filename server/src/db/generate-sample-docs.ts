import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

interface DocContent {
  title: string;
  subject: string;
  topic: string;
  department: string;
  pages: {
    heading: string;
    sections: { title: string; lines: string[] }[];
  }[];
}

const samplePdfs: Record<string, DocContent> = {
  'dsa-binary-trees.pdf': {
    title: 'Data Structures: Complete AVL Trees & Self-Balancing Trees',
    subject: 'Data Structures & Algorithms',
    topic: 'Binary Search Trees & AVL Balance Factor',
    department: 'Computer Science & Engineering',
    pages: [
      {
        heading: 'Unit 3: Balanced Search Trees Overview',
        sections: [
          {
            title: '1. Introduction to AVL Trees',
            lines: [
              'An AVL tree is a self-balancing Binary Search Tree (BST) where the difference',
              'between heights of left and right subtrees cannot be more than one for all nodes.',
              'The height of an AVL tree with n nodes is guaranteed to be O(log n).',
              '',
              'Balance Factor formula: BalanceFactor = height(left_subtree) - height(right_subtree)',
              'Permissible values for BalanceFactor in any valid AVL tree: {-1, 0, +1}.',
            ],
          },
          {
            title: '2. Why Self-Balancing Matters',
            lines: [
              'In an ordinary BST, skewed insertions result in worst-case lookup time of O(n).',
              'AVL trees enforce strict balance, ensuring lookup, insertion, and deletion are O(log n).',
            ],
          },
        ],
      },
      {
        heading: 'Unit 3: AVL Tree Rotations & Rebalancing',
        sections: [
          {
            title: '3. The Four Rotation Operations',
            lines: [
              'When an insertion causes an imbalance (|BF| > 1), we perform tree rotations:',
              '  - Left-Left (LL) Heavy: Perform a Single Right Rotation on the unbalanced node.',
              '  - Right-Right (RR) Heavy: Perform a Single Left Rotation on the unbalanced node.',
              '  - Left-Right (LR) Heavy: Perform Left Rotation on child, then Right on parent.',
              '  - Right-Left (RL) Heavy: Perform Right Rotation on child, then Left on parent.',
            ],
          },
          {
            title: '4. Complexity Breakdown',
            lines: [
              'Time Complexity: Search: O(log n), Insertion: O(log n), Deletion: O(log n)',
              'Space Complexity: O(n) for storage, plus O(log n) recursion stack.',
            ],
          },
        ],
      },
      {
        heading: 'Unit 3: Practical Java / C++ Implementation Notes',
        sections: [
          {
            title: '5. Node Structure and Rotation Pointers',
            lines: [
              'struct Node {',
              '    int key;',
              '    Node *left;',
              '    Node *right;',
              '    int height;',
              '};',
              '',
              'Always update node heights immediately following pointer re-assignments.',
              'Height recalculation: 1 + max(getHeight(node->left), getHeight(node->right));',
            ],
          },
          {
            title: '6. University Exam Tips',
            lines: [
              '- Always write down the balance factor of every node after each insertion step.',
              '- Clearly identify the node where the imbalance first occurred from bottom to top.',
            ],
          },
        ],
      },
    ],
  },
  'java-oop-mastery.pdf': {
    title: 'Object-Oriented Programming with Java: Collections & Streams API',
    subject: 'Java Programming',
    topic: 'Java Collections Framework & Lambda Streams',
    department: 'Computer Science & Engineering',
    pages: [
      {
        heading: 'Unit 4: Java Collections Framework Architecture',
        sections: [
          {
            title: '1. Collection Hierarchy',
            lines: [
              'The Java Collections Framework standardizes container objects across Java.',
              'Root interface: Iterable<T> -> Collection<E> -> List<E>, Set<E>, Queue<E>.',
              'Note: Map<K,V> does NOT extend Collection, but is part of the Collections Framework.',
            ],
          },
          {
            title: '2. Key Implementations Comparison',
            lines: [
              '- ArrayList: Dynamic array, O(1) random access, O(n) arbitrary insertions.',
              '- LinkedList: Doubly linked list, O(1) head/tail insertions, O(n) random access.',
              '- HashSet: Backed by HashMap, O(1) average lookup, permits single null element.',
              '- TreeSet: Red-Black tree, O(log n) operations, sorted by natural order or Comparator.',
            ],
          },
        ],
      },
      {
        heading: 'Unit 4: Streams API & Functional Pipelines',
        sections: [
          {
            title: '3. Stream Operations Workflow',
            lines: [
              'Streams operate lazily with intermediate and terminal operations:',
              '  Intermediate: filter(), map(), flatMap(), sorted(), distinct(), limit()',
              '  Terminal: collect(), forEach(), reduce(), count(), anyMatch(), findFirst()',
            ],
          },
          {
            title: '4. Code Example',
            lines: [
              'List<String> topStudents = students.stream()',
              '    .filter(s -> s.getGpa() >= 3.8)',
              '    .map(Student::getName)',
              '    .sorted()',
              '    .collect(Collectors.toList());',
            ],
          },
        ],
      },
    ],
  },
  'c-pointers-memory.pdf': {
    title: 'C Programming: Pointers, Memory Allocation & Struct Layouts',
    subject: 'C Programming',
    topic: 'Dynamic Memory & Struct Padding',
    department: 'Computer Science & Engineering',
    pages: [
      {
        heading: 'Unit 3: Pointers & Virtual Memory',
        sections: [
          {
            title: '1. Pointer Arithmetic & Addressing',
            lines: [
              'A pointer stores the memory address of another variable.',
              'int *ptr; // Points to an integer in memory',
              'Incrementing ptr (ptr++) advances the address by sizeof(*ptr) bytes.',
            ],
          },
          {
            title: '2. Heap vs Stack Memory',
            lines: [
              'Stack: Automatic storage duration, LIFO, managed by compiler.',
              'Heap: Dynamic allocation via malloc(), calloc(), realloc(), freed by free().',
              'Danger: Memory leaks occur when heap allocated blocks are not freed before pointers are lost.',
            ],
          },
        ],
      },
      {
        heading: 'Unit 3: Struct Memory Layout & Padding',
        sections: [
          {
            title: '3. Data Alignment and Structure Packing',
            lines: [
              'Modern CPUs read memory in words (4 or 8 bytes at a time).',
              'Compilers insert padding bytes between struct members to align them to boundaries.',
              'Order members from largest to smallest to minimize padding waste.',
            ],
          },
        ],
      },
    ],
  },
  'computer-networks-osi.pdf': {
    title: 'Computer Networks: OSI 7-Layer Model & TCP/IP Protocol Stack',
    subject: 'Computer Networks',
    topic: 'Layer Encapsulation, Framing & Routing',
    department: 'Information Technology',
    pages: [
      {
        heading: 'Unit 1: The OSI Reference Model',
        sections: [
          {
            title: '1. The 7 Layers Breakdown',
            lines: [
              'Layer 7 - Application: HTTP, DNS, FTP, SMTP (User interface and services)',
              'Layer 6 - Presentation: TLS/SSL, Data formatting, Compression, Encryption',
              'Layer 5 - Session: Sockets, RPC, Session state establishment',
              'Layer 4 - Transport: TCP, UDP, Ports, Flow control and error recovery',
              'Layer 3 - Network: IP, ICMP, Routing packets between networks',
              'Layer 2 - Data Link: Ethernet, MAC addresses, Framing, Error detection (CRC)',
              'Layer 1 - Physical: Bits, voltages, cables, radio frequencies (Physical media)',
            ],
          },
        ],
      },
    ],
  },
  'cyber-security-crypto.pdf': {
    title: 'Cryptography & Network Security: RSA, AES & Digital Signatures',
    subject: 'Cyber Security',
    topic: 'Public Key Infrastructure & Block Ciphers',
    department: 'Cyber Security',
    pages: [
      {
        heading: 'Unit 2: Symmetric vs Asymmetric Cryptography',
        sections: [
          {
            title: '1. AES (Advanced Encryption Standard)',
            lines: [
              'Symmetric block cipher with block size of 128 bits.',
              'Key lengths: 128, 192, or 256 bits.',
              'Rounds: 10 rounds for 128-bit, 12 for 192-bit, 14 for 256-bit.',
              'Four transformations per round: SubBytes, ShiftRows, MixColumns, AddRoundKey.',
            ],
          },
          {
            title: '2. RSA Public Key Cryptosystem',
            lines: [
              'Based on the mathematical difficulty of factoring large composite prime numbers.',
              'Keys: Public key (e, n), Private key (d, n).',
              'Encryption: C = M^e mod n, Decryption: M = C^d mod n.',
            ],
          },
        ],
      },
    ],
  },
  'discrete-mathematics-graphs.pdf': {
    title: 'Discrete Mathematics: Graph Theory & Recurrence Relations',
    subject: 'Mathematics',
    topic: 'Eulerian Graphs, Trees & Master Theorem',
    department: 'Applied Mathematics',
    pages: [
      {
        heading: 'Unit 4: Graph Theory Essentials',
        sections: [
          {
            title: '1. Graph Fundamentals',
            lines: [
              'A graph G = (V, E) consists of a set of vertices V and edges E.',
              'Handshaking Lemma: The sum of degrees of all vertices equals 2 * |E|.',
              'Eulerian Circuit: Exists if and only if every vertex has an even degree and graph is connected.',
              'Hamiltonian Cycle: Visited every vertex exactly once and returns to the start vertex.',
            ],
          },
        ],
      },
    ],
  },
};

async function generatePdf(fileName: string, data: DocContent) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const totalPages = data.pages.length;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const pageData = data.pages[pageIdx];
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait

    // Header banner bar
    page.drawRectangle({
      x: 0,
      y: 780,
      width: 595.28,
      height: 61.89,
      color: rgb(0.12, 0.15, 0.28), // Dark slate blue
    });

    // Brand and Subject in banner
    page.drawText('StudentShare  |  Find. Share. Learn.', {
      x: 40,
      y: 818,
      size: 11,
      font: fontBold,
      color: rgb(0.5, 0.7, 1.0),
    });

    page.drawText(`${data.subject} - ${data.department}`, {
      x: 40,
      y: 795,
      size: 10,
      font: fontRegular,
      color: rgb(0.85, 0.88, 0.95),
    });

    // Document Title
    page.drawText(data.title, {
      x: 40,
      y: 745,
      size: 15,
      font: fontBold,
      color: rgb(0.08, 0.1, 0.18),
    });

    // Section Heading
    page.drawText(pageData.heading, {
      x: 40,
      y: 715,
      size: 12,
      font: fontBold,
      color: rgb(0.25, 0.35, 0.75),
    });

    // Horizontal rule
    page.drawLine({
      start: { x: 40, y: 705 },
      end: { x: 555, y: 705 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    // Render sections
    let currentY = 680;
    for (const section of pageData.sections) {
      if (currentY < 120) break;

      // Section title
      page.drawText(section.title, {
        x: 40,
        y: currentY,
        size: 11,
        font: fontBold,
        color: rgb(0.15, 0.18, 0.25),
      });
      currentY -= 18;

      // Section lines
      for (const line of section.lines) {
        if (currentY < 80) break;
        if (line === '') {
          currentY -= 8;
          continue;
        }

        page.drawText(line, {
          x: 50,
          y: currentY,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.2, 0.22, 0.28),
        });
        currentY -= 14;
      }
      currentY -= 12;
    }

    // Footer divider line
    page.drawLine({
      start: { x: 40, y: 50 },
      end: { x: 555, y: 50 },
      thickness: 0.75,
      color: rgb(0.85, 0.88, 0.92),
    });

    // Footer text
    page.drawText('StudentShare Verified Academic Material', {
      x: 40,
      y: 35,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.65),
    });

    page.drawText(`Page ${pageIdx + 1} of ${totalPages}`, {
      x: 490,
      y: 35,
      size: 8.5,
      font: fontBold,
      color: rgb(0.3, 0.35, 0.45),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const dest = path.join(uploadsDir, fileName);
  fs.writeFileSync(dest, pdfBytes);
  console.log(`Generated valid PDF: ${fileName} (${pdfBytes.length} bytes, ${totalPages} pages)`);
}

async function generateDocx(fileName: string) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'StudentShare Academic Notes',
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Database Normalization Masterclass: 1NF to BCNF with Solved Examples',
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Subject: DBMS | Unit: Unit 2 | Author: Priya Patel',
                italics: true,
                color: '4F46E5',
              }),
            ],
          }),
          new Paragraph({
            text: '1. Functional Dependencies and Armstrong Axioms',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: 'A functional dependency X -> Y specifies that the value of X uniquely determines the value of Y in any relation R.',
          }),
          new Paragraph({
            text: 'The primary Armstrong axioms are Reflexivity, Augmentation, and Transitivity.',
          }),
          new Paragraph({
            text: '2. Normal Forms Breakdown',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: '1NF: Each column must contain atomic (indivisible) values. No repeating groups or comma-separated lists.',
          }),
          new Paragraph({
            text: '2NF: Relation is in 1NF and no non-prime attribute is partially dependent on any candidate key.',
          }),
          new Paragraph({
            text: '3NF: Relation is in 2NF and no non-prime attribute is transitively dependent on any candidate key.',
          }),
          new Paragraph({
            text: 'BCNF: For every non-trivial functional dependency X -> Y, X must be a super key.',
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const dest = path.join(uploadsDir, fileName);
  fs.writeFileSync(dest, buffer);
  console.log(`Generated valid DOCX: ${fileName} (${buffer.length} bytes)`);
}

async function generatePptx(fileName: string) {
  const zip = new JSZip();

  // Basic PPTX structure
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  zip.file(
    'ppt/_rels/presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide3.xml"/>
</Relationships>`
  );

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
    <p:sldId id="257" r:id="rId2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
    <p:sldId id="258" r:id="rId3" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
  </p:sldIdLst>
</p:presentation>`
  );

  const makeSlideXml = (title: string, bulletPoints: string[]) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:r><a:t>${title}</a:t></a:r></a:p>
          ${bulletPoints.map((bp) => `<a:p><a:r><a:t>• ${bp}</a:t></a:r></a:p>`).join('\n')}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

  zip.file(
    'ppt/slides/slide1.xml',
    makeSlideXml('Operating Systems: Process Synchronization', [
      'Welcome to Unit 2 Lecture Series',
      'Topic: Critical Section Problem & Peterson Solution',
      'Presented by Rahul Sharma (Computer Science & Engineering)',
    ])
  );

  zip.file(
    'ppt/slides/slide2.xml',
    makeSlideXml('The Critical Section Problem', [
      'Mutual Exclusion: If process Pi is executing in its critical section, no other processes can be.',
      'Progress: If no process is executing in its critical section, selection cannot be postponed indefinitely.',
      'Bounded Waiting: There must be a bound on the number of times other processes can enter.',
    ])
  );

  zip.file(
    'ppt/slides/slide3.xml',
    makeSlideXml('Semaphores & Banker Algorithm', [
      'Counting Semaphore vs Binary Semaphore (Mutex)',
      'Wait() / P() operation decrements the semaphore value',
      'Signal() / V() operation increments the semaphore value',
      'Banker algorithm checks for safe system state before granting resource requests',
    ])
  );

  const content = await zip.generateAsync({ type: 'nodebuffer' });
  const dest = path.join(uploadsDir, fileName);
  fs.writeFileSync(dest, content);
  console.log(`Generated valid PPTX: ${fileName} (${content.length} bytes)`);
}

async function main() {
  console.log('Generating high-quality, valid documents in server/uploads...');

  for (const [fileName, data] of Object.entries(samplePdfs)) {
    await generatePdf(fileName, data);
  }

  await generateDocx('dbms-normalization-guide.docx');
  await generatePptx('os-concurrency-slides.pptx');

  console.log('All sample documents successfully generated and verified!');
}

main().catch(console.error);
