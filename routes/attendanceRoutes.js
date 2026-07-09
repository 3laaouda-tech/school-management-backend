const express = require("express");
const Attendance = require("../models/Attendance");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// GET /api/attendance - list attendance records
// - admin/teacher: all records (optionally filter by ?classId=)
// - student: only their own records
router.get("/", protect, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "student") {
      filter.studentId = req.user.id;
    } else if (req.query.classId) {
      filter.classId = req.query.classId;
    }

    const records = await Attendance.find(filter)
      .populate("studentId", "name email")
      .populate("classId", "name grade");

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/attendance - add an attendance record (admin + teacher only)
router.post("/", protect, allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { studentId, classId, date, status } = req.body;
    const record = await Attendance.create({ studentId, classId, date, status });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/attendance/:id - update a record (admin + teacher only)
router.put("/:id", protect, allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { date, status } = req.body;
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { date, status },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/attendance/:id - delete a record (admin + teacher only)
router.delete("/:id", protect, allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json({ message: "Attendance record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
