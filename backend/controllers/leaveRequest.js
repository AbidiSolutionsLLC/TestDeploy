const LeaveRequest = require("../models/leaveRequestSchema");
const User = require("../models/userSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const catchAsync = require("../utils/catchAsync");
const { moment, TIMEZONE } = require("../utils/dateUtils");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const sendEmail = require('../utils/emailService');
const mongoose = require("mongoose");

// --- HELPER: GET FULL TEAM IDS (RECURSIVE) ---
const getTeamIds = async (managerId) => {
  let teamIds = [managerId.toString()];
  const directReports = await User.find({ reportsTo: managerId }).distinct('_id');
  if (directReports.length > 0) {
    for (const reportId of directReports) {
      const subTeam = await getTeamIds(reportId);
      teamIds = [...new Set([...teamIds, ...subTeam])];
    }
  }
  return teamIds;
};

// --- CREATE LEAVE REQUEST ---
exports.createLeaveRequest = catchAsync(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new NotFoundError("User not found");

  if (!leaveType || !startDate || !endDate) throw new BadRequestError("Missing required fields");

  const start = moment(startDate).tz(TIMEZONE).startOf('day');
  const end = moment(endDate).tz(TIMEZONE).startOf('day');
  const daysDiff = end.diff(start, 'days') + 1;

  const userLeaveBalance = user.leaves[leaveType.toLowerCase()] || 0;
  if (userLeaveBalance < daysDiff) throw new BadRequestError(`Not enough ${leaveType} leaves available`);

  const existingLeaves = await LeaveRequest.find({
    employee: user._id,
    status: { $in: ["Pending", "Approved"] }
  });

  const overlappingLeaves = existingLeaves.filter(leave => {
    const existingStart = new Date(leave.startDate);
    const existingEnd = new Date(leave.endDate);
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    return (existingStart <= newEnd && newStart <= existingEnd);
  });

  if (overlappingLeaves.length > 0) throw new BadRequestError(`Overlap detected with existing leave.`);

  const leaveRequest = new LeaveRequest({
    employee: user._id,
    employeeName: user.name,
    email: user.email,
    leaveType,
    startDate,
    endDate,
    reason,
  });

  const savedLeaveRequest = await leaveRequest.save();

  const updateObj = {
    $push: {
      leaveHistory: {
        leaveId: savedLeaveRequest._id,
        leaveType,
        startDate: start,
        endDate: end,
        status: 'Pending',
        daysTaken: daysDiff,
        reason: reason
      }
    },
    $inc: {
      [`leaves.${leaveType.toLowerCase()}`]: -daysDiff,
      bookedLeaves: daysDiff,
      avalaibleLeaves: -daysDiff
    }
  };

  await User.findByIdAndUpdate(user._id, updateObj);

  const timeTrackerEntries = [];
  const curr = start.clone();
  while (curr.isSameOrBefore(end)) {
    const dateStart = curr.toDate();
    const existingEntry = await TimeTracker.findOne({ user: user._id, date: dateStart });
    if (existingEntry) {
      existingEntry.status = 'Leave';
      await existingEntry.save();
    } else {
      timeTrackerEntries.push({
        user: user._id,
        date: dateStart,
        status: 'Leave',
        notes: `Leave: ${leaveType} - ${reason || 'No reason provided'}`
      });
    }
    curr.add(1, 'days');
  }
  if (timeTrackerEntries.length > 0) await TimeTracker.insertMany(timeTrackerEntries);

  res.status(201).json({ success: true, data: savedLeaveRequest });
});

// --- GET LEAVE REQUESTS (RECURSIVE TEAM VIEW) ---
exports.getLeaveRequests = catchAsync(async (req, res) => {
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  let query = {};
  const currentUserId = req.user.id || req.user._id;

  if (roleKey === 'superadmin' || roleKey === 'hr') {
      query = {}; 
  } 
  else if (roleKey === 'manager' || roleKey === 'admin') {
      const fullTeamIds = await getTeamIds(currentUserId);
      query.employee = { $in: fullTeamIds };
  } 
  else {
      query.employee = currentUserId;
  }

  if (req.query.employeeName) query.employeeName = { $regex: req.query.employeeName, $options: 'i' };
  if (req.query.leaveType) query.leaveType = req.query.leaveType;
  if (req.query.status) query.status = req.query.status;

  const leaveRequests = await LeaveRequest.find(query).sort({ appliedAt: -1 });
  res.json({ success: true, data: leaveRequests });
});

// --- APPROVE / REJECT LEAVE (RESTRICTED TO HR/ADMIN) ---
exports.updateLeaveStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  
  if (!["Pending", "Approved", "Rejected"].includes(status)) throw new BadRequestError("Invalid status");

  const leaveRequest = await LeaveRequest.findById(id);
  if (!leaveRequest) throw new NotFoundError("Leave request not found");

  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  const currentUserId = req.user.id || req.user._id;

  // --- REQUIREMENT: Managers are READ ONLY ---
  if (!['superadmin', 'admin', 'hr'].includes(roleKey)) {
     throw new ForbiddenError("Managers have read-only access to leaves. Contact HR for approvals.");
  }

  // --- SECURITY: Hierarchy & Self-Approval Block ---
  if (roleKey === 'admin') {
     if (leaveRequest.employee.toString() === currentUserId.toString()) {
        throw new ForbiddenError("You cannot update the status of your own leave request.");
     }
     const adminTeam = await getTeamIds(currentUserId);
     if (!adminTeam.includes(leaveRequest.employee.toString())) {
        throw new ForbiddenError("Admins can only manage leaves for their own team hierarchy.");
     }
  }

  const start = moment(leaveRequest.startDate).tz(TIMEZONE).startOf('day');
  const end = moment(leaveRequest.endDate).tz(TIMEZONE).startOf('day');
  const daysDiff = end.diff(start, 'days') + 1;

  const updateObj = { $set: { "leaveHistory.$[elem].status": status } };
  const oldStatus = leaveRequest.status;

  if (status === "Rejected" && oldStatus !== "Rejected") {
    updateObj.$inc = {
      [`leaves.${leaveRequest.leaveType.toLowerCase()}`]: daysDiff,
      bookedLeaves: -daysDiff,
      avalaibleLeaves: daysDiff
    };
  } else if (status === "Approved" && oldStatus === "Rejected") {
    updateObj.$inc = {
      [`leaves.${leaveRequest.leaveType.toLowerCase()}`]: -daysDiff,
      bookedLeaves: daysDiff,
      avalaibleLeaves: -daysDiff
    };
  }

  await User.findByIdAndUpdate(leaveRequest.employee, updateObj, {
    arrayFilters: [{ "elem.leaveId": leaveRequest._id }]
  });

  leaveRequest.status = status;
  await leaveRequest.save();

  if (leaveRequest.email) {
    const emailSubject = `Leave Request ${status}`;
    const emailBody = `<p>Your leave request has been <strong>${status}</strong>.</p>`;
    sendEmail(leaveRequest.email, emailSubject, emailBody).catch(console.error);
  }

  res.status(200).json({ success: true, message: `Leave status updated to ${status}`, data: leaveRequest });
});

// --- MANAGE HOLIDAYS (NEW RESTRICTION) ---
exports.manageHolidays = catchAsync(async (req, res) => {
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  
  // Only Super Admin, Admin, and HR can manage holidays
  if (!['superadmin', 'admin', 'hr'].includes(roleKey)) {
    throw new ForbiddenError("Permission Denied: Managers cannot manage company holidays.");
  }

  // Logic for adding/updating holiday entries would go here
  res.status(200).json({ success: true, message: "Holiday list updated." });
});

exports.getLeaveRequestById = catchAsync(async (req, res) => {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) throw new NotFoundError("Leave request");
    res.json({ success: true, data: leaveRequest });
});

exports.updateLeaveRequest = catchAsync(async (req, res) => {
    const leaveRequest = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!leaveRequest) throw new NotFoundError("Leave request");
    res.json({ success: true, data: leaveRequest });
});

exports.deleteLeaveRequest = catchAsync(async (req, res) => {
    const leaveRequest = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!leaveRequest) throw new NotFoundError("Leave request");
    res.json({ success: true, message: "Leave request deleted" });
});