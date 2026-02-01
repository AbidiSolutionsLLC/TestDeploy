const TimeTracker = require("../models/timeTrackerSchema");
const User = require("../models/userSchema");
const catchAsync = require("../utils/catchAsync");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../utils/ExpressError");
const { getSearchScope } = require("../utils/rbac"); 
const { getStartOfESTDay } = require("../utils/dateUtils");

// --- HELPER: GET FULL TEAM IDS (RECURSIVE) ---
const getTeamIds = async (managerId) => {
  let teamIds = [managerId];
  
  // Find all direct reports
  const directReports = await User.find({ reportsTo: managerId }).distinct('_id');
  
  if (directReports.length > 0) {
    teamIds = [...teamIds, ...directReports];
    
    // Recursively find reports of reports
    for (const reportId of directReports) {
      const subTeam = await getTeamIds(reportId);
      teamIds = [...new Set([...teamIds, ...subTeam])];
    }
  }
  return teamIds;
};

const isWeekend = (date) => {
  const day = date.getDay(); 
  return day === 0 || day === 6;
};

// --- 1. GET ALL LOGS (Read Access) ---
exports.getAllTimeLogs = catchAsync(async (req, res) => {
  const { id, role } = req.user;
  const roleKey = role ? role.replace(/\s+/g, '').toLowerCase() : "";

  let query = {};

  // STRICT HIERARCHY ENFORCEMENT
  if (roleKey === 'manager') {
    const myFullTeam = await getTeamIds(id);
    query.user = { $in: myFullTeam };
  } else {
    // Fallback to standard RBAC for SuperAdmin, Admin, HR, and Employee
    const scope = await getSearchScope(req.user, 'attendance');
    Object.assign(query, scope);
  }

  const logs = await TimeTracker.find(query)
    .populate('user', 'name email designation department avatar empID')
    .sort({ date: -1 });

  res.status(200).json(logs);
});

exports.getAllTimeTrackers = exports.getAllTimeLogs;

// --- 2. UPDATE TIME LOG (Write/Edit Access) ---
exports.updateTimeLog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;

  if (role !== 'Super Admin') {
    throw new ForbiddenError("Access Denied. Only Super Admins can edit attendance records.");
  }

  let updates = { ...req.body };

  if (updates.checkInTime && updates.checkOutTime) {
    const start = new Date(updates.checkInTime);
    const end = new Date(updates.checkOutTime);
    const diffMs = end - start;
    
    if (updates.totalHours === undefined) {
        updates.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    if (!updates.status) {
      if (updates.totalHours >= 8) updates.status = "Present";
      else if (updates.totalHours >= 4.5) updates.status = "Half Day";
      else updates.status = "Absent";
    }
  }

  const log = await TimeTracker.findByIdAndUpdate(id, updates, { 
    new: true,
    runValidators: true 
  }).populate('user', 'name email');

  if (!log) throw new NotFoundError("Attendance record not found");
  
  res.status(200).json(log);
});

// --- 3. GET MONTHLY ATTENDANCE (REFINED TEAM VIEW) ---
exports.getMonthlyAttendance = catchAsync(async (req, res) => {
  const { month, year } = req.params;
  const { id, role } = req.user;
  
  let query = {
    date: { 
      $gte: new Date(year, month - 1, 1), 
      $lte: new Date(year, month, 0, 23, 59, 59) 
    }
  };

  const roleKey = role ? role.replace(/\s+/g, '').toLowerCase() : "";

  // Apply strict subordinate filter for Managers
  if (roleKey === 'manager') {
    const myFullTeamIds = await getTeamIds(id);
    query.user = { $in: myFullTeamIds };
  } else if (!['superadmin', 'admin', 'hr'].includes(roleKey)) {
    // Normal employees only see themselves
    query.user = id;
  }

  const attendance = await TimeTracker.find(query)
    .populate('user', 'name designation avatar department')
    .sort({ date: 1 });

  res.status(200).json(attendance);
});

// --- PERSONAL ACTIONS ---

exports.getMyTimeLogs = catchAsync(async (req, res) => {
  const logs = await TimeTracker.find({ user: req.user.id }).sort({ date: -1 });
  res.status(200).json(logs);
});

exports.checkIn = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const todayStart = getStartOfESTDay(now);

  if (isWeekend(now)) {
    return res.status(403).json({ message: "Check-in is not allowed on weekends." });
  }

  const existingLogForToday = await TimeTracker.findOne({ user: userId, date: todayStart });
  if (existingLogForToday) {
    return res.status(400).json({ message: "You have already checked in for today." });
  }

  const abandonedSession = await TimeTracker.findOne({ user: userId, checkOutTime: { $exists: false } });
  let previousSessionMsg = "";

  if (abandonedSession) {
    abandonedSession.checkOutTime = now;
    abandonedSession.autoCheckedOut = true;
    abandonedSession.status = "Absent"; 
    abandonedSession.notes = (abandonedSession.notes || "") + " | System closed during next check-in";
    await abandonedSession.save();
    previousSessionMsg = "Note: Your previous open session was closed and marked Absent. ";
  }

  const newLog = await TimeTracker.create({ user: userId, date: todayStart, checkInTime: now, status: 'Present' });
  res.status(200).json({ message: `${previousSessionMsg}Checked in successfully.`, log: newLog });
});

exports.checkOut = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const currentLog = await TimeTracker.findOne({ user: userId, checkOutTime: { $exists: false } });

  if (!currentLog) throw new BadRequestError("No active check-in found.");

  const now = new Date();
  currentLog.checkOutTime = now;
  const totalMs = currentLog.checkOutTime - new Date(currentLog.checkInTime);
  const totalHours = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));
  currentLog.totalHours = totalHours;

  if (totalHours >= 8) currentLog.status = "Present";
  else if (totalHours >= 4.5) currentLog.status = "Half Day";
  else currentLog.status = "Absent";

  await currentLog.save();
  res.status(200).json({ message: "Checked out successfully", log: currentLog });
});

exports.getDailyLog = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const todayStart = getStartOfESTDay();
  const log = await TimeTracker.findOne({ user: userId, date: todayStart });

  if (!log) return res.status(200).json({ message: "No log found for today", log: null });
  res.status(200).json({ log });
});

// --- ADMIN / CRUD ---

exports.createTimeLog = catchAsync(async (req, res) => {
  const newLog = await TimeTracker.create(req.body);
  res.status(201).json(newLog);
});

exports.getTimeLogById = catchAsync(async (req, res) => {
  const log = await TimeTracker.findById(req.params.id).populate('user');
  if (!log) throw new NotFoundError("Time log not found");
  res.status(200).json(log);
});

exports.deleteTimeLog = catchAsync(async (req, res) => {
  if (req.user.role !== 'Super Admin') {
    throw new ForbiddenError("Access Denied. Only Super Admin can delete records.");
  }
  const log = await TimeTracker.findByIdAndDelete(req.params.id);
  if (!log) throw new NotFoundError("Time log not found");
  res.status(200).json({ message: "Deleted successfully" });
});