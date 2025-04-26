import express from "express";
import asyncHandler from "express-async-handler";
import Role from "../models/Role.js";

const router = express.Router();

// @desc    Get all roles
// @route   GET /api/roles
// @access  Public
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const roles = await Role.find({});
    res.json(roles);
  })
);

export default router;
