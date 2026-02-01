const Holiday = require("../models/holidaySchema");
const User = require("../models/userSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");

// --- CREATE HOLIDAY ---
exports.createHoliday = catchAsync(async (req, res) => {
  // Defensive check to prevent crash if middleware is skipped
  if (!req.user || !req.user.role) {
    throw new ForbiddenError("Authentication required.");
  }

  // Permission Check: Strictly block Managers
  if (!['Super Admin', 'Admin', 'HR'].includes(req.user.role)) {
    throw new ForbiddenError("Permission Denied: Managers cannot manage company holidays.");
  }

  const { date, day, holidayName, holidayType, description, isRecurring } = req.body;

  const existingHoliday = await Holiday.findOne({ date });
  if (existingHoliday) {
    throw new BadRequestError("Holiday for this date already exists");
  }

  const newHoliday = new Holiday({
    date,
    day,
    holidayName,
    holidayType,
    description,
    isRecurring: isRecurring || false,
  });

  const savedHoliday = await newHoliday.save();

  const holidayDate = new Date(date);
  holidayDate.setHours(0, 0, 0, 0);

  const allUsers = await User.find({ empStatus: "Active" }).select("_id");
  const userIds = allUsers.map(user => user._id);

  const existingEntries = await TimeTracker.find({
    date: holidayDate,
    user: { $in: userIds }
  });

  const existingUserIds = new Set(existingEntries.map(entry => entry.user.toString()));
  const entriesToUpdate = [];
  const entriesToCreate = [];

  for (const entry of existingEntries) {
    if (entry.status !== 'Leave') {
      entriesToUpdate.push(entry._id);
    }
  }

  for (const user of allUsers) {
    if (!existingUserIds.has(user._id.toString())) {
      entriesToCreate.push({
        user: user._id,
        date: holidayDate,
        status: 'Holiday',
        notes: `Holiday: ${holidayName}`
      });
    }
  }

  if (entriesToUpdate.length > 0) {
    await TimeTracker.updateMany(
      { _id: { $in: entriesToUpdate } },
      { $set: { status: 'Holiday', notes: `Holiday: ${holidayName}` } }
    );
  }

  if (entriesToCreate.length > 0) {
    await TimeTracker.insertMany(entriesToCreate);
  }

  res.status(201).json(savedHoliday);
});

// --- GET ALL HOLIDAYS ---
exports.getAllHolidays = catchAsync(async (req, res) => {
  const holidays = await Holiday.find().sort({ date: 1 });
  res.status(200).json(holidays);
});

// --- GET HOLIDAY BY ID ---
exports.getHolidayById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const holiday = await Holiday.findById(id);
  if (!holiday) throw new NotFoundError("Holiday");
  res.status(200).json(holiday);
});

// --- UPDATE HOLIDAY ---
exports.updateHoliday = catchAsync(async (req, res) => {
  if (!req.user || !['Super Admin', 'Admin', 'HR'].includes(req.user.role)) {
    throw new ForbiddenError("Permission Denied: Managers cannot manage company holidays.");
  }

  const { id } = req.params;
  const updates = { ...req.body };

  const holiday = await Holiday.findById(id);
  if (!holiday) throw new NotFoundError("Holiday");

  const oldDate = new Date(holiday.date);
  oldDate.setHours(0, 0, 0, 0);

  const allowedFields = ["date", "day", "holidayName", "holidayType", "description", "isRecurring"];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) holiday[field] = updates[field];
  });

  const updatedHoliday = await holiday.save();

  if (updates.date) {
    const newDate = new Date(updates.date);
    newDate.setHours(0, 0, 0, 0);

    await TimeTracker.updateMany(
      { date: oldDate, status: { $ne: 'Leave' } },
      { $set: { status: 'Present', notes: '' } }
    );

    const allUsers = await User.find({ empStatus: "Active" }).select("_id");
    const timeTrackerEntries = [];

    for (const user of allUsers) {
      const existingEntry = await TimeTracker.findOne({ user: user._id, date: newDate });
      if (existingEntry) {
        if (existingEntry.status !== 'Leave') {
          existingEntry.status = 'Holiday';
          existingEntry.notes = `Holiday: ${holiday.holidayName}`;
          await existingEntry.save();
        }
      } else {
        timeTrackerEntries.push({
          user: user._id,
          date: newDate,
          status: 'Holiday',
          notes: `Holiday: ${holiday.holidayName}`
        });
      }
    }

    if (timeTrackerEntries.length > 0) await TimeTracker.insertMany(timeTrackerEntries);
  } else if (updates.holidayName) {
    await TimeTracker.updateMany(
      { date: oldDate, status: 'Holiday' },
      { $set: { notes: `Holiday: ${holiday.holidayName}` } }
    );
  }

  res.status(200).json(updatedHoliday);
});

// --- DELETE HOLIDAY ---
exports.deleteHoliday = catchAsync(async (req, res) => {
  if (!req.user || !['Super Admin', 'Admin', 'HR'].includes(req.user.role)) {
    throw new ForbiddenError("Permission Denied: Managers cannot manage company holidays.");
  }

  const { id } = req.params;
  const holiday = await Holiday.findByIdAndDelete(id);
  if (!holiday) throw new NotFoundError("Holiday");

  const holidayDate = new Date(holiday.date);
  holidayDate.setHours(0, 0, 0, 0);

  await TimeTracker.updateMany(
    { date: holidayDate, status: 'Holiday' },
    { $set: { status: 'Present', notes: '' } }
  );

  res.status(200).json({ message: "Holiday deleted successfully" });
});

// --- GET HOLIDAYS BY YEAR ---
exports.getHolidaysByYear = catchAsync(async (req, res) => {
  const { year } = req.params;
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  const holidays = await Holiday.find({
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  res.status(200).json(holidays);
});