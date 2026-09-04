import { getDb } from "./db";
import { subjects } from "../drizzle/schema";

const seedSubjects = [
  ["Data Structures", "CS 201", "Computer Science", "Semester 3"],
  ["Java Programming", "CS 203", "Computer Science", "Semester 3"],
  ["Python", "CS 204", "Computer Science", "Semester 3"],
  ["Database Management", "CS 305", "Computer Science", "Semester 4"],
  ["Computer Networks", "CS 308", "Computer Science", "Semester 4"],
  ["Operating Systems", "CS 310", "Computer Science", "Semester 4"],
  ["Mathematics", "MATH 101", "General", "Semester 1"],
  ["Cyber Security", "CS 402", "Computer Science", "Semester 5"],
] as const;

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  for (const [name, code, department, semester] of seedSubjects) {
    await db.insert(subjects).values({ name, code, department, semester }).onDuplicateKeyUpdate({ set: { department, semester } });
  }
  console.log(`Seeded ${seedSubjects.length} StudentShare subjects.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
