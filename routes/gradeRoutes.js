const express = require("express");
const Grade = require("../models/Grade");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// GET /api/grades - list grades
// - admin/teacher: all grades (optionally filter by ?classId=)
// - student: only their own grades
router.get("/", protect, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "student") {
      filter.studentId = req.user.id;
    } else if (req.query.classId) {
      filter.classId = req.query.classId;
    }

    const grades = await Grade.find(filter)
      .populate("studentId", "name email")
      .populate("classId", "name grade");

    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/grades - add a grade (admin + teacher only)
router.post("/", protect, allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { studentId, classId, subject, score, term } = req.body;
    const grade = await Grade.create({ studentId, classId, subject, score, term });
    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/grades/:id - update a grade (admin + teacher only)
router.put("/:id", protect, allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const { subject, score, term } = req.body;
    const updated = await Grade.findByIdAndUpdate(
      req.params.id,
      { subject, score, term },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Grade not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/grades/:id - delete a grade (admin + teacher only)
router.delete("/:id", protect, allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const deleted = await Grade.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Grade not found" });
    }
    res.json({ message: "Grade deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
