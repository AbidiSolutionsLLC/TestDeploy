const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    azureId: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      select: false, 
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Super Admin", "Admin", "HR", "Manager", "Employee" , "Technician"],
      required: true,
      default: "Employee",
    },
    // --- NEW FIELD: DUAL ROLE SUPPORT ---
    isTechnician: {
      type: Boolean,
      default: false
    },
    // ------------------------------------
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    jobLevel: {
      type: Number,
      default: 5,
    },
    designation: {
      type: String,
      default: "New Hire",
    },
    branch: {
      type: String,
      default: "Main",
    },
    empType: {
      type: String,
      enum: ["Permanent", "Contractor", "Intern", "Part Time"],
      default: "Permanent",
    },
    empID: {
      type: String,
      default: "TBD",
    },
    empStatus: {
      type: String,
      enum: ["Active", "Inactive", "Pending"],
      default: "Active",
    },
    timeZone: {
      type: String,
      default: "UTC",
    },
    avatar: {
      type: String,
      default: "",
    },
    joiningDate: { type: Date, default: Date.now },
    phoneNumber: {
      type: String,
      sparse: true, 
    },
    address: { type: String },
    salary: { type: Number },
    about: { type: String },
    experience: [
      {
        company: String,
        jobType: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        startYear: Number,
        endYear: Number,
      },
    ],
    DOB: { type: String },
    maritalStatus: { type: String },
    emergencyContact: [
      {
        name: String,
        relation: String,
        phone: Number,
      },
    ],
    addedby: { type: String },
    avalaibleLeaves: { type: Number, default: 15 },
    bookedLeaves: { type: Number, default: 0 },
    leaveHistory: [
      {
        leaveId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveRequest" },
        leaveType: String,
        startDate: Date,
        endDate: Date,
        status: String,
        daysTaken: Number,
        reason: String,
      },
    ],
    leaves: {
      pto: { type: Number, default: 10 },
      sick: { type: Number, default: 5 },
    },
    dashboardCards: [
      {
        type: {
          type: String,
          enum: [
            "feeds",
            "attendance",
            "holidays",
            "todo",
            "notes",
            "recent activities",
            "birthdays",
            "leavelog",
            "upcomingDeadlines",
            "timeoffBalance",
            "tasksAssignedToMe",
          ],
        },
        id: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("findOneAndDelete", async function (next) {
  const user = await this.model.findOne(this.getFilter());
  if (!user) return next();

  const userId = user._id;

  // Clean dependent collections
  await Promise.all([
    mongoose.model("Ticket").deleteMany({
      $or: [{ closedBy: userId }, { assignedTo: userId }],
    }),
    mongoose.model("LeaveRequest").deleteMany({ employee: userId }),
    mongoose.model("TimeLog").deleteMany({ employee: userId }),
    mongoose.model("Timesheet").deleteMany({ employee: userId }),
    mongoose.model("TimeTracker").deleteMany({ user: userId }),

    mongoose.model("Department").updateMany(
      {},
      {
        $pull: { members: userId },
        $set: { manager: null },
      }
    ),

    mongoose.model("User").updateMany(
      { reportsTo: userId },
      { $set: { reportsTo: null } }
    ),
  ]);

  next();
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;