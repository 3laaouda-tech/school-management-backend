const express = require("express");
const Class = require("../models/Class");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// GET /api/classes - list all classes (any logged-in user)
router.get("/", protect, async (req, res) => {
  try {
    const classes = await Class.find().populate("teacherId", "name email");
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/classes/:id/students - list students in one class (admin + teacher)
router.get("/:id/students", protect, allowRoles("admin", "teacher"), async (req, res) => {
  try {
    const students = await User.find({ classId: req.params.id, role: "student" }).select("-password");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/classes - create a class (admin only)
router.post("/", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { name, grade, teacherId } = req.body;
    const newClass = await Class.create({ name, grade, teacherId: teacherId || null });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/classes/:id - update a class (admin only)
router.put("/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { name, grade, teacherId } = req.body;
    const updated = await Class.findByIdAndUpdate(
      req.params.id,
      { name, grade, teacherId },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/classes/:id - delete a class (admin only)
router.delete("/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json({ message: "Class deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
