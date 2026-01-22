const mongoose = require("mongoose");

const timesheetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    submittedHours: {
      type: Number,
      required: true,
      default: 0,
    },
    approvedHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    timeLogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TimeLog",
      },
    ],
    attachments: [
      {
        public_id: String,
        url: String,
        originalname: String,
        format: String,
        size: Number,
        blobName: String
      },
    ],
  },
  {
    timestamps: true,
  }
);

timesheetSchema.index({ employee: 1, "date": 1 }, { 
  partialFilterExpression: { 
    date: { $exists: true },
    employee: { $exists: true }
  }
});

// Add virtual for week number
timesheetSchema.virtual('weekNumber').get(function() {
  const date = new Date(this.date);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
});

timesheetSchema.set('toJSON', { virtuals: true });
timesheetSchema.set('toObject', { virtuals: true });

const Timesheet = mongoose.models.Timesheet || mongoose.model("Timesheet", timesheetSchema);
module.exports = Timesheet;