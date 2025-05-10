import React from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StudentRegister from './students/StudentRegister';
import HomePage from './pages/HomePage';
import ClubRegister from './pages/ClubRegister';
import ClubLogin from './pages/ClubLogin';
import StudentLogin from './students/StudentLogin';
import StudentClubsPage from './students/StudentClubsPage';
import MyClubsPage from './students/MyClubsPage'; // Placeholder
import JoinClubsPage from './students/JoinClubsPage'; // Placeholder
import ClubSidebar from './pages/ClubSidebar';
import StudentSidebar from './students/StudentSidebar';
import ClubDashboard from './pages/ClubDashboard';
import StudentDashboard from './students/StudentDashboard';
import StudentProfile from './students/studentProfile';
import UpcomingEvents from './students/UpcomingEvents';
import ClubEvents from './pages/ClubEvents';
import EventBooking from './pages/EventBooking';
import ApprovedEvents from './pages/ApprovedEvents';
import PendingEvents from './pages/PendingEvents';
import RejectedEvents from './pages/RejectedEvents';
import ClubRecruitments from './pages/ClubRecruitments';
import ClubMembers from './pages/ClubMembers';
import ClubProfile from './pages/ClubProfile';
import ClubSettings from './pages/ClubSettings';
import BudgetPage from './pages/BudgetPage';
import RecruitmentEvaluationPage from './pages/EvaluateApplicants';
import AdminLogin from './admin/AdminLogin';
import AdminSidebar from './admin/AdminSidebar'; // Create this component
import AdminDashboard from './admin/AdminDashboard'; // Placeholder
import ManageStudents from './admin/ManageStudents'; // Placeholder
import ManageClubs from './admin/ManageClubs'; // Placeholder
import ManageEvents from './admin/ManageEvents';
import Settings from './admin/Settings'; // Placeholder
import styles from './App.module.css';
axios.defaults.withCredentials = true;


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register-student" element={<StudentRegister />} />
                <Route path="/login-student" element={<StudentLogin />} /> {/* Assuming you'll create this */}
                <Route path="/student/*" element={<StudentLayout />} />
                <Route path="/register-club" element={<ClubRegister />} />
                <Route path="/login-club" element={<ClubLogin />} />
                <Route path="/login-admin" element={<AdminLogin />} />
                <Route path="/admin/*" element={<AdminLayout />} />
                <Route path="/club/*" element={<ClubLayout />} /> {/* Use a layout component for the dashboard */}
            </Routes>
        </Router>
    );
}

function ClubLayout() {
    return (
        <div className={styles.dashboardContainer}> {/* Apply the grid layout here */}
            <ClubSidebar />
            <div className={styles.mainContentArea}> {/* New div for main content with max-width */}
                <Routes>
                    <Route path="overview" element={<ClubDashboard />} /> {/* Default dashboard view is ClubDashboard */}
                    <Route path="events/*" element={<ClubEventsRoutes />} /> {/* Nested routes for events */}
                    <Route path="recruitments" element={<ClubRecruitments />} />
                    <Route path="members" element={<ClubMembers />} />
                    <Route path="profile" element={<ClubProfile />} />
                    <Route path="settings" element={<ClubSettings />} />
                    <Route path="recruitments/evaluate/:semester" element={<RecruitmentEvaluationPage />} />
                </Routes>
            </div>
        </div>
    );
}
function ClubEventsRoutes() {
    return (
        <Routes>
            <Route index element={<ClubEvents />} />
            <Route path="booking" element={<EventBooking />} />
            <Route path="approved" element={<ApprovedEvents />} />
            <Route path="pending" element={<PendingEvents />} />
            <Route path="rejected" element={<RejectedEvents />} />
            <Route path="budget/:eventId" element={<BudgetPage />} />
    
        </Routes>
    );
}



function StudentLayout() {
    return (
        <div className={styles.dashboardContainer}> {/* Use the same container style */}
            <StudentSidebar />
            <div className={styles.mainContentArea}>
                <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    {/* Add other student-related routes here */}
                    <Route path="clubs" element={<StudentClubsPage />} />
                    <Route path="myclubs" element={<MyClubsPage />} />
                    <Route path="joinclubs" element={<JoinClubsPage />} />
                    <Route path="upcoming-events" element={<UpcomingEvents />} />
                    <Route path="profile" element={<StudentProfile />} />
                </Routes>
            </div>
        </div>
    );
}

function AdminLayout() {
    return (
        <div className={styles.dashboardContainer}> {/* Re-use the same container layout style */}
            <AdminSidebar />
            <div className={styles.mainContentArea}> {/* Re-use the same main content area style */}
                <Routes>
                    {/* Admin routes */}
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="events" element={<ManageEvents />} />
                    <Route path="students" element={<ManageStudents />} /> {/* Ensure ManageStudents component exists */}
                    <Route path="clubs" element={<ManageClubs />} /> {/* Ensure ManageClubs component exists */}
                    <Route path="settings" element={<Settings />} /> {/* Ensure Settings component exists */}
                    {/* Add other admin routes as needed */}
                    {/* <Route path="*" element={<NotFound />} /> */}
                </Routes>
            </div>
        </div>
    );
}
export default App;