import {
  HomeIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  BriefcaseIcon,
  TicketIcon,
  ClipboardDocumentCheckIcon, 
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ChartPieIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";

// People Module
const peopleLinks = [
  { name: "Home", path: "/people/home", icon: HomeIcon, roles: ["All"] },
  { name: "Profile", path: "/people/profile", icon: UserCircleIcon, roles: ["All"] },
  { name: "Attendance", path: "/people/attendance", icon: CalendarDaysIcon, roles: ["All"] },
  { name: "Time Tracker", path: "/people/timetracker", icon: ClockIcon, roles: ["All"] },
  { name: "Leave Tracker", path: "/leave/summary", icon: BriefcaseIcon, roles: ["All"] },
  { name: "Raise a Ticket", path: "/people/raise", icon: TicketIcon, roles: ["All"] },
  
  { 
    name: "Assigned Tickets", 
    path: "/people/assigned-tickets", 
    icon: ClipboardDocumentCheckIcon, 
    technicianOnly: true 
  },


  { 
    name: "Org Chart", 
    path: "/people/org-chart", 
    icon: UserGroupIcon, 
    roles: ["All"] 
  },

  // --- MOVED TO LAST POSITION ---
  
];

// Admin Module
const adminLinks = [
  { name: "Dashboard", path: "/admin/dashboard", icon: ShieldCheckIcon, roles: ["Super Admin", "Admin", "HR"] },
  { name: "User Management", path: "/admin/userManagement", icon: UsersIcon, roles: ["Super Admin", "Admin", "HR"] },
  { name: "Attendance", path: "/admin/attendance", icon: CalendarDaysIcon, roles: ["Super Admin", "Admin", "HR"] },
  { name: "Leaves", path: "/admin/leaveManagement", icon: BriefcaseIcon, roles: ["Super Admin", "Admin", "HR"] },
  { name: "Time Sheets", path: "/admin/timesheet", icon: ClockIcon, roles: ["Super Admin", "Admin", "HR"] },
  
  // Assign Ticket remains Admin/Super Admin (and Tech Managers) only
  { 
    name: "Assign Ticket", 
    path: "/admin/assign-ticket", 
    icon: TicketIcon, 
    roles: ["Super Admin", "Admin"] 
  },
];

export const moduleConfigs = {
  people: {
    links: peopleLinks,
  },
  
  leave: {
    links: peopleLinks, 
  },
  file: {
    links: peopleLinks, 
  },
  faq: {
    links: peopleLinks, 
  },

  admin: {
    links: [
      { name: "Admin DashBoard", path: "/admin/adminDashboard", icon: ShieldCheckIcon },
      { name: "Attendance", path: "/admin/attendance", icon: CalendarDaysIcon },
      { name: "User Management", path: "/admin/userManagement", icon: UsersIcon },
      { name: "Leave Management", path: "/admin/leaveTrackerAdmin", icon: BriefcaseIcon },
      { name: "Approve Time Sheets", path: "/admin/approve", icon: CheckBadgeIcon },
      { name: "Assign Ticket", path: "/admin/assign-ticket", icon: TicketIcon },

    ],
  },
};