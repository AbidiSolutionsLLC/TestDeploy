const express = require("express");
const router = express.Router();
const leaveController = require("../../controllers/leaveRequest");
const catchAsync = require("../../utils/catchAsync");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

router.use(isLoggedIn);

// --- FIX: Add the specific route the frontend is calling ---
router.get("/getAllLeaves", leaveController.getLeaveRequests);

router
  .route("/")
  .post(leaveController.createLeaveRequest)
  .get(leaveController.getLeaveRequests);

router
  .route("/:id")
  .get(leaveController.getLeaveRequestById)
  .put(leaveController.updateLeaveRequest)
  .delete(leaveController.deleteLeaveRequest);

router.put("/:id/status", leaveController.updateLeaveStatus);

module.exports = router;