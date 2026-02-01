import { Routes, Route, Navigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import "./index.css"; 

// Layouts
import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthLayout";

// Pages
import ThemeSelector from "./Pages/ThemeSelector";
import Login from "./Pages/login/Login";
import Home from "./Pages/People/Home";
import TimeTracker from "./Pages/People/TimeTracker";
import Files from "./Pages/People/Files";
import Profile from "./Pages/People/Profile";
import Attendance from "./Pages/People/Attendance";
import EditProfile from "./Pages/People/EditProfile";
import LeaveTracker from "./Pages/People/LeaveTracker";
import LeaveTrackerAdmin from "./Pages/People/LeaveTrackerAdmin";
import FileTabs from "./Pages/People/FileTabs";
import ProjectDashBoard from "./Pages/Projects/ProjectDashBoard";
import Projects from "./Pages/Projects/Projects";
import Project from "./Pages/Projects/Project";
import UserManagement from "./Pages/Admin/UserManagement";
import LeaveRequest from "./Pages/People/LeaveRequest";
import ApproveTimesheets from "./Pages/People/ApproveTimesheets";
import { ToastContainer } from "react-toastify";
import PrivateRoute from "./Components/PrivateRoute";
import PublicRoute from "./Components/PublicRoute";
import "react-toastify/dist/ReactToastify.css";
import Ticket from "./Pages/Tickets/Ticket";
import AdminTickets from "./Pages/Tickets/AdminTickets";
import AdminDashBoard from "./Pages/Admin/AdminDashBoard";
import ActivityLogs from "./Pages/Admin/ActivityLogs";
import MyTask from "./Pages/Projects/MyTask";
import useAutoLogin from "./Hooks/useAutoLogin";
import { TimeLogProvider } from "../src/Pages/People/TimeLogContext";
import Role from "./Pages/People/sharedWithRole";
import UploadDocument from "./Pages/People/UploadDocument";
import FAQs from "./Pages/People/FAQ";
import AssignTicket from "./Pages/Tickets/AssignTickets";
import ProjectDetail from "./Pages/Projects/ProjectDetail";
import ComingSoon from "./Pages/Projects/ComingSoon";
import OrgChartPage from "./Pages/Admin/OrgChart";
import AssignedTickets from "./Pages/People/AssignedTickets";
import AdminAttendance from "./Pages/Admin/AdminAttendance"; 


function App() {
  useAutoLogin();
  
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        limit={1}
        style={{ zIndex: 9999999 }} 
      />
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" />} />

        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          }
        >
          <Route index path="login" element={<Login />} />
        </Route>

        <Route path="/theme-selector" element={<ThemeSelector />} />

        {/* --- PEOPLE PORTAL --- */}
        <Route
          path="/people/*"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/people/home" />} />
          <Route path='home' element={<Home />} />
          <Route path="timetracker" element={<TimeTracker />} />
          <Route index path="summary" element={<LeaveTracker />} />
          <Route index path="shared" element={<Files />} />
          <Route index path="raise" element={<Ticket />} />
          <Route path="assigned-tickets" element={<AssignedTickets />} />
          <Route index path="history" element={<TimeTracker />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="FAQs" element={<FAQs />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:id" element={<Profile />} />
          <Route path="org-chart" element={<OrgChartPage />} />
        </Route>

        <Route path="/leave/*" element={<AppLayout />}>
          <Route index element={<Navigate to="/leave/summary" />} />
          <Route index path="summary" element={<LeaveTracker />} />
          <Route path="request" element={<LeaveRequest />} />
          <Route path="leaveTrackerAdmin" element={<LeaveTrackerAdmin />} />
        </Route>

        <Route path="/file/*" element={<AppLayout />}>
          <Route index element={<Navigate to="/file/shared" />} />
          <Route index path="shared" element={<Files />} />
          <Route path="role" element={<Role />} />
          <Route path="upload" element={<UploadDocument />} />
        </Route>
        
       <Route path="/project/*" element={<AppLayout />}>
          <Route index element={<ComingSoon />} />
          <Route path="projectDashboard" element={<ComingSoon />} />
          <Route path="projects" element={<ComingSoon />} />
          <Route path="projectDetailed/:id" element={<ComingSoon />} />
        </Route>

        <Route path="/faq/*" element={<AppLayout />}>
          <Route index element={<FAQs />} />
        </Route>

        <Route path="/admin/*" element={<AppLayout />}>
          <Route index element={<Navigate to="adminDashboard" replace />} />
          <Route index path="adminDashboard" element={<AdminDashBoard />} />
          <Route path="leaveTrackerAdmin" element={<LeaveTrackerAdmin />} />
          <Route path="upload" element={<UploadDocument />} />
          <Route path="userManagement" element={<UserManagement />} />
          <Route path="approve" element={<ApproveTimesheets />} />
          <Route path="assign-ticket" element={<AdminTickets />} />
          <Route path="assign-ticket/:ticketId" element={<AssignTicket />} />
          <Route path="attendance" element={<AdminAttendance />} />
          
          {/* Org Chart Route REMOVED from here */}
        </Route>
      </Routes>
    </>
  );
}

export default App;