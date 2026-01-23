import { Routes, Route, Navigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import "./index.css"; // your Tailwind styles

// Layouts
import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthLayout";

// Pages
import ThemeSelector from "./Pages/ThemeSelector";
import Login from "./Pages/login/Login";
// import ForgotPass from "./Pages/login/ForgotPass";
// import ResetPassword from "./Pages/login/Resetpassword";
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
// import VerifyOtp from "./Pages/login/VerifyOtp";
import Ticket from "./Pages/Tickets/Ticket";
import AdminTickets from "./Pages/Tickets/AdminTickets";
import AdminDashBoard from "./Pages/Admin/AdminDashBoard";
import ActivityLogs from "./Pages/Admin/ActivityLogs";
import MyTask from "./Pages/Projects/MyTask";
// import useAutoLogin from "./Hooks/useAutoLogin";
import { TimeLogProvider } from "../src/Pages/People/TimeLogContext";
import Role from "./Pages/People/sharedWithRole";
import UploadDocument from "./Pages/People/UploadDocument";
import FAQs from "./Pages/People/FAQ";
// import RequestHR from "./Pages/People/
// import useTokenRefresh from "./Hooks/useTokenRefresh";
import AssignTicket from "./Pages/Tickets/AssignTickets";
import ProjectDetail from "./Pages/Projects/ProjectDetail";
import ComingSoon from "./Pages/Projects/ComingSoon";
import OrgChartPage from "./Pages/Admin/OrgChart";


function App() {
  // useAutoLogin();
  // useTokenRefresh();
  return (
    <>
      <ToastContainer
        position="top-right"
autoClose={3000}        // Ensure this is set (3 seconds)
        hideProgressBar={true}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        limit={1}
      />
      <Routes>
        {/* Redirect to login by default */}
        <Route path="/" element={<Navigate to="/auth/login" />} />

        {/* Auth routes */}
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          }
        >
          <Route index path="login" element={<Login />} />
          {/* <Route path="forgot-password" element={<ForgotPass />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route path="verify-otp" element={<VerifyOtp />} /> */}
        </Route>

        {/* Theme Selector */}
        <Route path="/theme-selector" element={<ThemeSelector />} />

        {/* Main App Routes with AppLayout and SubNavbar */}
        <Route
          path="/people/*"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/people/home" />} />
          <Route
            path='home' element={<Home />} />
          <Route path="timetracker" element={<TimeTracker />} />
          <Route index path="summary" element={<LeaveTracker />} />
          <Route index path="shared" element={<Files />} />
          {/* <Route path="files" element={<Files />} /> */}
          <Route index path="raise" element={<Ticket />} />
          <Route index path="history" element={<TimeTracker />} />
          <Route path="profile" element={<Profile />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="FAQs" element={<FAQs />} />
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

        {/* <Route path="/time/*" element={<AppLayout />}>
          <Route index element={<Navigate to="history" replace />} />
          <Route index path="history" element={<TimeTracker />} />{" "}
          <Route path="approve" element={<ApproveTimesheets />} />
        </Route> */}

        {/* <Route path="/tickets/*" element={<AppLayout />}>
          <Route index element={<Navigate to="raise" replace />} />
          <Route index path="raise" element={<Ticket />} />
          <Route path="ticketlist" element={<AdminTickets />} /> */}
          {/* <Route path ="leaveTrackerAdmin" element={<LeaveTrackerAdmin/>}/> */}
        {/* </Route> */}
        
       <Route path="/project/*" element={<AppLayout />}>
  {/* You can point everything inside projects to ComingSoon */}
  <Route index element={<ComingSoon />} />
  <Route path="projectDashboard" element={<ComingSoon />} />
  <Route path="projects" element={<ComingSoon />} />
  <Route path="projectDetailed/:id" element={<ComingSoon />} />
</Route>

        <Route path="/faq/*" element={<AppLayout />}>
          <Route index element={<FAQs />} />
          {/* <Route path="requestHR" element={<RequestHR/>} /> */}
        </Route>

        <Route path="/admin/*" element={<AppLayout />}>
          <Route index element={<Navigate to="adminDashboard" replace />} /> //
          Redirect
          <Route index path="adminDashboard" element={<AdminDashBoard />} />
             <Route path="leaveTrackerAdmin" element={<LeaveTrackerAdmin />} />
                <Route path="upload" element={<UploadDocument />} />
          <Route path="userManagement" element={<UserManagement />} />
          {/* <Route path="logs" element={<ActivityLogs />} /> */}
          <Route path="approve" element={<ApproveTimesheets />} />
          <Route path="assign-ticket" element={<AdminTickets />} />
          <Route path="assign-ticket/:ticketId" element={<AssignTicket />} />
          <Route path="org-chart" element={<OrgChartPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
