import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux"; // Import useDispatch
import { useMsal } from "@azure/msal-react"; // Import MSAL hook
import { logout } from "../slices/authSlice"; // Import logout action (adjust path if needed)

import NavBarVertical from "../Components/NavBarVertical";
import SubNavbarVertical from "../Components/SubNavbarVertical";
import RightSidebar from "../Components/RightSidebar"; 
import { 
  MagnifyingGlassIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon // Icon for logout
} from "@heroicons/react/24/solid";

const AppLayout = () => {
  const [isRightBarOpen, setRightBarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State for dropdown
  const settingsRef = useRef(null); // Ref for clicking outside
  
  const location = useLocation();
  const isPeoplePortal = location.pathname.startsWith("/people");
  
  // Auth Hooks
  const dispatch = useDispatch();
  const { instance } = useMsal();

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout Function
  const handleLogout = () => {
    // 1. Clear Redux State
    dispatch(logout());
    
    // 2. Sign out of Azure and Redirect
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    }).catch(e => {
      console.error("Logout error:", e);
    });
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#CDD9EA] font-sans">
      
      {/* Header */}
      {/* <header className="w-full h-14 flex items-center justify-between px-6 z-[60] bg-transparent"> */}
        {/* Left: Brand */}
        {/* <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
            A
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-800 uppercase">
            Abidi Pro
          </span>
        </div> */}

        {/* Right: Search, Notification, Settings */}
        {/* <div className="flex items-center gap-4">
          Search Bar */}
          {/* <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent w-64 transition-all"
            />
          </div> */}

          {/* Notification Icon */}
          {/* <button className="relative p-2 hover:bg-white/50 rounded-xl transition-colors">
            <BellIcon className="h-5 w-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button> */}

          {/* Settings Dropdown */}
          {/* <div className="relative" ref={settingsRef}> */}
            {/* <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-xl transition-colors ${isSettingsOpen ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
            >
              <Cog6ToothIcon className="h-5 w-5 text-slate-600" />
            </button> */}

            {/* Dropdown Menu */}
            {/* {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-[70] origin-top-right transform transition-all">
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
            )} */}
          {/* </div>

        </div>
      </header> */}

      <div className="flex w-full h-full items-start">
        
        {/* Sidebar with equal height containers */}
        <aside className="mt-2 z-50 flex h-[calc(100vh-2rem)] pl-2">  
          <div className="flex items-stretch h-full">
            {/* NavBarVertical - centered vertically */}
            <div className="flex items-center h-full">
              <NavBarVertical />
            </div>
            {/* SubNavbarVertical - same height as NavBarVertical */}
            <div className="flex items-center h-full">
              <SubNavbarVertical />
            </div>
          </div>
        </aside>

        {/* Main Content Container */}
        <main className="flex-1 m-2 ml-2 rounded-[2rem] bg-[#ECF0F3] shadow-lg text-slate-800 h-[calc(100vh-2rem)] transition-all duration-500 ease-in-out overflow-hidden">
          <div className="p-5 h-full overflow-auto no-scrollbar">
            <Outlet />
          </div>
        </main>

        {/* Right Sidebar for People Portal */}
        {isPeoplePortal && (
          <RightSidebar 
            isOpen={isRightBarOpen}
            toggleSidebar={() => setRightBarOpen(!isRightBarOpen)}
          />
        )}
      </div>
    </div>
  );
};

export default AppLayout;