const Timesheet = require("../models/timesheetSchema");
const TimeLog = require("../models/timeLogsSchema");
// --- NEW: Import User to find subordinates ---
const User = require("../models/userSchema"); 
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const { cloudinary } = require("../storageConfig");
const { getStartOfESTDay, getEndOfESTDay, moment, TIMEZONE } = require("../utils/dateUtils");
const sendEmail = require('../utils/emailService');

// Create Timesheet
exports.createTimesheet = catchAsync(async (req, res) => {
  let { name, description, timeLogs, date } = req.body;
  const employee = req.user.id;
  const employeeName = req.user.name;

  let logIds = [];
  if (Array.isArray(timeLogs)) {
    logIds = timeLogs;
  } else if (timeLogs) {
    logIds = [timeLogs];
  }

  if (logIds.length === 0) {
    throw new BadRequestError("No time logs provided");
  }

  let timesheetDate;
  if (date) {
    const safeDate = new Date(date);
    timesheetDate = new Date(safeDate.getTime() + safeDate.getTimezoneOffset() * 60000);
  } else {
    timesheetDate = getStartOfESTDay();
  }

  const timesheetDateStart = getStartOfESTDay(timesheetDate);
  const timesheetDateEnd = getEndOfESTDay(timesheetDate);

  const existingTimesheet = await Timesheet.findOne({
    employee,
    date: {
      $gte: timesheetDateStart,
      $lte: timesheetDateEnd
    }
  });

  if (existingTimesheet) {
    throw new BadRequestError(`You have already submitted a timesheet for ${timesheetDate.toLocaleDateString()}.`);
  }

  const logs = await TimeLog.find({
    _id: { $in: logIds },
    employee,
    isAddedToTimesheet: false,
  });

  if (logs.length !== logIds.length) {
    throw new BadRequestError("Invalid time logs or logs already added to another timesheet");
  }

  const submittedHours = logs.reduce((total, log) => total + log.hours, 0);

  const weekStartMoment = moment(timesheetDate).tz(TIMEZONE).startOf('isoWeek');
  const weekEndMoment = moment(timesheetDate).tz(TIMEZONE).endOf('isoWeek');
  const startOfWeek = weekStartMoment.toDate();
  const endOfWeek = weekEndMoment.toDate();

  const weeklyTimesheets = await Timesheet.find({
    employee,
    date: { $gte: startOfWeek, $lte: endOfWeek },
    status: { $in: ["Pending", "Approved"] }
  });

  const weeklyTotalHours = weeklyTimesheets.reduce((total, sheet) => total + sheet.submittedHours, 0);

  if (weeklyTotalHours + submittedHours > 40) {
    throw new BadRequestError(`Weekly hour limit (40 hours) exceeded.`);
  }

  const targetDateStr = timesheetDate.toISOString().split('T')[0];
  const mismatchedLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    const logDateStr = logDate.toISOString().split('T')[0]; 
    return logDateStr !== targetDateStr;
  });

  if (mismatchedLogs.length > 0) {
    throw new BadRequestError(`All time logs must be for the same date as the timesheet (${targetDateStr}).`);
  }

  const attachmentData = req.files?.map(file => ({
    public_id: file.public_id,
    url: file.path,
    originalname: file.originalname,
    format: file.format,
    size: file.size
  }));

  const timesheet = new Timesheet({
    name,
    description,
    employee,
    employeeName,
    date: timesheetDate,
    submittedHours,
    timeLogs: logIds,
    attachments: attachmentData || [],
  });

  const savedTimesheet = await timesheet.save();

  await TimeLog.updateMany(
    { _id: { $in: logIds } },
    { isAddedToTimesheet: true, timesheet: savedTimesheet._id }
  );

  res.status(201).json(savedTimesheet);
});

// --- FIX: Logic to see Subordinates for Admin/Manager ---
exports.getWeeklyTimesheets = catchAsync(async (req, res) => {
  const { weekStart } = req.query; 

  if (!weekStart) {
    throw new BadRequestError("Week start date is required");
  }

  const startDate = moment(weekStart).tz(TIMEZONE).startOf('day').toDate();
  const endDate = moment(startDate).tz(TIMEZONE).add(6, 'days').endOf('day').toDate();

  let query = {
    date: {
      $gte: startDate,
      $lte: endDate
    }
  };

  // --- LOGIC START ---
  if (req.user.role === 'Super Admin') {
    // 1. Super Admin sees EVERYTHING. No filter needed.
  } 
  else if (req.user.role === 'Admin' || req.user.role === 'Manager') {
    // 2. Admin/Manager sees: Themselves + Their Subordinates
    
    // Find all users who report to this Admin
    const subordinates = await User.find({ reportingManager: req.user._id }).select('_id');
    const subordinateIds = subordinates.map(user => user._id);
    
    // Add Admin's own ID to the list (so they see their own sheets too)
    subordinateIds.push(req.user._id);

    // Filter timesheets where employee is in this list
    query.employee = { $in: subordinateIds };
  } 
  else {
    // 3. Regular Employee sees only their own
    query.employee = req.user.id;
  }
  // --- LOGIC END ---

  const timesheets = await Timesheet.find(query)
    .populate("timeLogs")
    .populate("employee", "name email role") 
    .sort({ date: 1 });

  const weeklyTotal = timesheets.reduce((total, sheet) => total + sheet.submittedHours, 0);

  const processedTimesheets = timesheets.map(timesheet => ({
    ...timesheet.toObject(),
    date: timesheet.date.toISOString()
  }));

  res.status(200).json({
    weekStart: startDate.toISOString(),
    weekEnd: endDate.toISOString(),
    timesheets: processedTimesheets,
    weeklyTotal,
    // Note: This remainingHours calc is only accurate if viewing a single user. 
    // For admin view, it might be misleading, but we keep it to prevent frontend crash.
    remainingHours: Math.max(0, 40 - weeklyTotal) 
  });
});

exports.getEmployeeTimesheets = catchAsync(async (req, res) => {
  const { month, year, startDate, endDate } = req.query;

  let query = {};

  // --- Same Logic applied here for Month View ---
  if (req.user.role === 'Super Admin') {
      // No filter
  } else if (req.user.role === 'Admin' || req.user.role === 'Manager') {
      const subordinates = await User.find({ reportingManager: req.user._id }).select('_id');
      const subordinateIds = subordinates.map(user => user._id);
      subordinateIds.push(req.user._id);
      query.employee = { $in: subordinateIds };
  } else {
      query.employee = req.user.id;
  }
  // ---------------------------------------------

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  else if (month && year) {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    query.date = {
      $gte: start,
      $lte: end
    };
  }

  const timesheets = await Timesheet.find(query)
    .populate("timeLogs")
    .populate("employee", "name email")
    .sort({ date: -1 });

  res.status(200).json(timesheets);
});

exports.getTimesheetById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const timesheet = await Timesheet.findById(id).populate("timeLogs");
  if (!timesheet) throw new NotFoundError("Timesheet");
  res.status(200).json(timesheet);
});

exports.updateTimesheetStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, approvedHours } = req.body;

  const timesheet = await Timesheet.findById(id).populate('employee', 'name email');
  
  if (!timesheet) throw new NotFoundError("Timesheet");

  // Optional: Prevent Admins from approving their own timesheets
  // if (timesheet.employee._id.toString() === req.user.id && req.user.role !== 'Super Admin') {
  //   throw new ForbiddenError("You cannot approve your own timesheet.");
  // }

  timesheet.status = status;
  if (approvedHours !== undefined) {
    timesheet.approvedHours = approvedHours;
  }

  const updatedTimesheet = await timesheet.save();

  if (timesheet.employee && timesheet.employee.email) {
    const statusColor = status === 'Approved' ? '#2e7d32' : '#c62828';
    const emailSubject = `Timesheet Update: ${status}`;
    
    const emailBody = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background-color: ${statusColor}; color: white; padding: 20px; text-align: center;">
          <h2 style="margin:0;">Timesheet ${status}</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hello <strong>${timesheet.employee.name}</strong>,</p>
          <p>Your timesheet submission for <strong>${new Date(timesheet.date).toDateString()}</strong> has been reviewed.</p>
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Status:</strong> ${status}</p>
            ${approvedHours ? `<p style="margin: 5px 0;"><strong>Approved Hours:</strong> ${approvedHours}</p>` : ''}
          </div>
        </div>
      </div>
    `;
    sendEmail(timesheet.employee.email, emailSubject, emailBody)
      .catch(err => console.error("❌ Timesheet Email Failed:", err.message));
  }

  res.status(200).json(updatedTimesheet);
});

exports.getAllTimesheets = catchAsync(async (req, res) => {
  const { month, year } = req.query;

  let query = {};
  
  // Apply the same Subordinate filter here if needed, 
  // currently, 'getAllTimesheets' implies an unrestricted view (Super Admin style).
  // If regular Admins use this endpoint, apply the same filter as above.
  
  if (month && year) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    query.date = {
      $gte: startDate,
      $lte: endDate
    };
  }

  const timesheets = await Timesheet.find(query)
    .populate("timeLogs")
    .populate("employee", "name email role") 
    .sort({ date: -1 });

  res.status(200).json(timesheets);
});

exports.downloadAttachment = catchAsync(async (req, res) => {
  const { id, attachmentId } = req.params;

  const timesheet = await Timesheet.findById(id);
  if (!timesheet) throw new NotFoundError("Timesheet");

  const attachment = timesheet.attachments.id(attachmentId);
  if (!attachment) {
    throw new NotFoundError("Attachment");
  }

  try {
    if (attachment.public_id) {
      const downloadUrl = cloudinary.url(attachment.public_id, {
        secure: true,
        resource_type: 'raw',
        flags: 'attachment',
        attachment: attachment.originalname,
        sign_url: true
      });
      return res.redirect(downloadUrl);
    } else if (attachment.url) {
      const response = await fetch(attachment.url);
      const buffer = await response.buffer();
      res.set({
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${attachment.originalname}"`,
        'Content-Length': buffer.length
      });
      return res.send(buffer);
    } else {
      throw new BadRequestError("No valid attachment URL found");
    }
  } catch (error) {
    console.error("Download error:", error);
    if (attachment.url) return res.redirect(attachment.url);
    throw new BadRequestError("Failed to generate download link");
  }
});