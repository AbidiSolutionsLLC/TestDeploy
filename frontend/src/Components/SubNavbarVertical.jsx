import React, { useState, useRef, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { moduleConfigs } from "../routeConfig";
import { useDispatch } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { logout } from "../slices/authSlice";
import api from "../axios";
import {
  HomeIcon, TicketIcon, CalendarDaysIcon, ClockIcon,
  UserCircleIcon, BriefcaseIcon, DocumentIcon, UserGroupIcon,
  Squares2X2Icon, ChartPieIcon, RectangleStackIcon,
  ClipboardDocumentListIcon, ShieldCheckIcon, UsersIcon,
  FolderPlusIcon, CheckBadgeIcon, TicketIcon as AssignTicketIcon,
  Cog6ToothIcon, ArrowRightOnRectangleIcon
} from "@heroicons/react/20/solid";

const SubNavbarVertical = () => {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const mainModule = pathname.split("/")[1] || "Menu";
  const rawLinks = moduleConfigs[mainModule]?.links || [];

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const dispatch = useDispatch();
  const { instance } = useMsal();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
  };

  // --- RBAC Link Filtering Logic ---
  const filteredLinks = rawLinks.filter(link => {
    if (!user) return false;

    // 1. Assigned Tickets: Show for Techs, Tech-Managers, and Super Admins
    if (link.name === "Assigned Tickets") {
      const isTech = user.isTechnician || user.role === "Technician";
      const isManagerTech = user.role === "Manager" && user.isTechnician;
      return user.role === "Super Admin" || isTech || isManagerTech;
    }

    // 2. Assign Ticket: Show for Super Admin, Admin, or Tech-Managers
    if (link.name === "Assign Ticket") {
      const isManagerTech = user.role === "Manager" && user.isTechnician;
      return user.role === "Super Admin" || user.role === "Admin" || isManagerTech;
    }

    // 3. User Management: Standard Admin/HR access
    if (link.name === "User Management") {
      return ["Super Admin", "Admin", "HR"].includes(user.role);
    }

    // 4. FIX: Hide "Approve Time Sheets" specifically for HR
    if (link.name === "Approve Time Sheets") {
      return user.role !== "HR"; 
    }

    return true; 
  });

  const iconMap = {
    "Home": HomeIcon, "Profile": UserCircleIcon, "Attendance": CalendarDaysIcon,
    "Time Tracker": ClockIcon, "Leave Tracker": BriefcaseIcon, "Ticket": TicketIcon,
    "Raise a Ticket": TicketIcon, "Ticket List": TicketIcon, "Shared with me": UserGroupIcon,
    "Shared with Role": UserCircleIcon, "Upload Document": DocumentIcon, "Approve Timelogs": CheckBadgeIcon,
    "Project DashBoard": ChartPieIcon, "Projects": RectangleStackIcon, "My Tasks": ClipboardDocumentListIcon,
    "Admin DashBoard": ShieldCheckIcon, "Leave Management": BriefcaseIcon, "User Management": UsersIcon,
    "File Management": FolderPlusIcon, "Approve Time Sheets": CheckBadgeIcon, "Assign Ticket": AssignTicketIcon,
    "Assigned Tickets": AssignTicketIcon,
    "Org Chart": UserGroupIcon, // Added Icon mapping
    "default": Squares2X2Icon
  };

  if (!filteredLinks.length) return null;

  return (
    <aside className="w-[5.5rem] h-full bg-white/90 backdrop-blur-sm rounded-[2rem] flex flex-col items-center pb-6 z-[70] shadow-sm border border-white/50 relative">
      <div className="w-full py-4 flex items-center justify-center bg-slate-200 mb-2 rounded-t-[2rem]">
        <div className="w-6 h-6 bg-slate-800 flex items-center justify-center text-white text-lg font-bold shadow-md rounded-[6px]">
          A
        </div>
      </div>
      <div className="flex flex-col items-center mb-2">
        <div className="text-center">
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">
            {mainModule}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full px-1 overflow-y-auto no-scrollbar flex flex-col gap-2">
        {filteredLinks.map((link) => {
          const Icon = iconMap[link.name] || iconMap["default"];
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `w-full py-3 flex flex-col items-center justify-center rounded-[1.2rem] transition-all duration-300 ${isActive
                  ? "bg-[#E0E5EA] text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1.5" />
              <span className="text-[9px] font-bold uppercase tracking-tight text-center px-1 leading-tight max-w-[70px]">
                {link.name}
              </span>
            </NavLink>
          );
        })}
      </div>

      <div className=" pt-1 border-t border-slate-100 w-full px-2 flex flex-col items-center flex-shrink-0 relative" ref={settingsRef}>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`w-full py-2 flex flex-col items-center justify-center rounded-[1.2rem] transition-colors ${isSettingsOpen ? 'bg-slate-100 shadow-inner text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Cog6ToothIcon className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase mt-1">Settings</span>
        </button>

        {isSettingsOpen && (
          <div className="absolute left-full bottom-0 ml-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-[80] origin-bottom-left animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settings</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SubNavbarVertical;