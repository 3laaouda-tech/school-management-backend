// Run this once with: node seedDemoData.js
// Creates a batch of demo teachers, classes, students, grades and
// attendance records so the dashboard has realistic-looking data to explore.
//
// This is separate from seed.js (which only creates the admin account).
// Run seed.js first if you haven't already.
//
// Safe to re-run: it clears out any previously generated demo data
// (identified by the @demo.brighthorizon.edu.jo email domain) before
// creating a fresh batch.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Class = require("./models/Class");
const Grade = require("./models/Grade");
const Attendance = require("./models/Attendance");

const DEMO_DOMAIN = "demo.brighthorizon.edu.jo";
const DEMO_PASSWORD = "password123";

const teacherNames = [
  "Laila Haddad",
  "Omar Nasser",
  "Dana Khalil",
  "Yousef Saleh",
  "Rania Odeh",
  "Karim Aburas",
];

const classDefs = [
  { name: "Grade 1 - A", grade: "1" },
  { name: "Grade 3 - A", grade: "3" },
  { name: "Grade 5 - A", grade: "5" },
  { name: "Grade 7 - A", grade: "7" },
  { name: "Grade 9 - A", grade: "9" },
  { name: "Grade 11 - A", grade: "11" },
];

const studentFirstNames = [
  "Ahmad",
  "Sara",
  "Yazan",
  "Lina",
  "Zaid",
  "Nour",
  "Hamza",
  "Tala",
  "Fadi",
  "Maya",
  "Rakan",
  "Jana",
  "Adam",
  "Layan",
  "Karam",
  "Hala",
  "Firas",
  "Aya",
  "Malek",
  "Reem",
];

const studentLastNames = [
  "Sweidan",
  "Barakat",
  "Qasem",
  "Zoubi",
  "Rawashdeh",
  "Hijazi",
  "Masri",
  "Btoush",
  "Ghazawi",
  "Salameh",
];

const subjects = ["Mathematics", "Science", "English", "Arabic", "Social Studies"];
const terms = ["Term 1", "Term 2"];

// Deterministic-ish random helpers so the data still looks natural
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomScore = () => Math.floor(Math.random() * 41) + 60; // 60-100
const randomStatus = () => randomFrom(["present", "present", "present", "absent", "late"]);

const run = async () => {
  await connectDB();

  console.log("Clearing previous demo data...");
  const oldDemoUsers = await User.find({ email: { $regex: `@${DEMO_DOMAIN}$` } });
  const oldDemoUserIds = oldDemoUsers.map((u) => u._id);
  await Grade.deleteMany({ studentId: { $in: oldDemoUserIds } });
  await Attendance.deleteMany({ studentId: { $in: oldDemoUserIds } });
  await User.deleteMany({ email: { $regex: `@${DEMO_DOMAIN}$` } });
  await Class.deleteMany({ name: { $in: classDefs.map((c) => c.name) } });

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Teachers ---
  console.log("Creating teachers...");
  const teachers = [];
  for (let i = 0; i < teacherNames.length; i++) {
    const name = teacherNames[i];
    const email = `${name.toLowerCase().replace(/\s+/g, ".")}@${DEMO_DOMAIN}`;
    const teacher = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "teacher",
    });
    teachers.push(teacher);
  }

  // --- Classes (one teacher per class) ---
  console.log("Creating classes...");
  const classes = [];
  for (let i = 0; i < classDefs.length; i++) {
    const def = classDefs[i];
    const newClass = await Class.create({
      name: def.name,
      grade: def.grade,
      teacherId: teachers[i % teachers.length]._id,
    });
    classes.push(newClass);
  }

  // --- Students (spread across classes, ~8 per class) ---
  console.log("Creating students...");
  const students = [];
  let studentCounter = 1;
  for (const cls of classes) {
    for (let i = 0; i < 8; i++) {
      const first = randomFrom(studentFirstNames);
      const last = randomFrom(studentLastNames);
      const name = `${first} ${last}`;
      // Add a counter to keep emails unique even with repeated name combos
      const email = `${first.toLowerCase()}.${last.toLowerCase()}${studentCounter}@${DEMO_DOMAIN}`;
      studentCounter++;

      const student = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "student",
        classId: cls._id,
      });
      students.push({ student, classId: cls._id });
    }
  }

  // --- Grades (2-3 per subject per student, so dashboards have real numbers) ---
  console.log("Creating grades...");
  const gradeDocs = [];
  for (const { student, classId } of students) {
    for (const subject of subjects) {
      for (const term of terms) {
        gradeDocs.push({
          studentId: student._id,
          classId,
          subject,
          score: randomScore(),
          term,
        });
      }
    }
  }
  await Grade.insertMany(gradeDocs);

  // --- Attendance (last 10 school days per student) ---
  console.log("Creating attendance records...");
  const attendanceDocs = [];
  const today = new Date();
  for (const { student, classId } of students) {
    for (let d = 0; d < 10; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      attendanceDocs.push({
        studentId: student._id,
        classId,
        date,
        status: randomStatus(),
      });
    }
  }
  await Attendance.insertMany(attendanceDocs);

  console.log("\nDone!");
  console.log(`Teachers created: ${teachers.length}`);
  console.log(`Classes created: ${classes.length}`);
  console.log(`Students created: ${students.length}`);
  console.log(`Grades created: ${gradeDocs.length}`);
  console.log(`Attendance records created: ${attendanceDocs.length}`);
  console.log(`\nAll demo accounts use the password: ${DEMO_PASSWORD}`);
  console.log(`Example teacher login: ${teachers[0].email}`);
  console.log(`Example student login: ${students[0].student.email}`);

  mongoose.connection.close();
};

run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
