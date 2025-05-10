import React from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StudentRegister from './students/StudentRegister';
import HomePage from './pages/HomePage';
import ClubRegister from './pages/ClubRegister';
import ClubLogin from './pages/ClubLogin';
import StudentLogin from './students/StudentLogin';
import StudentClubsPage from './students/StudentClubsPage';
import MyClubsPage from './students/MyClubsPage'; 
import JoinClubsPage from './students/JoinClubsPage'; 
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
import AdminSidebar from './admin/AdminSidebar'; 
import AdminDashboard from './admin/AdminDashboard'; 
import ManageStudents from './admin/ManageStudents'; 
import ManageClubs from './admin/ManageClubs'; 
import ManageEvents from './admin/ManageEvents';
import Settings from './admin/Settings';
import styles from './App.module.css';
axios.defaults.withCredentials = true;


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register-student" element={<StudentRegister />} />
                <Route path="/login-student" element={<StudentLogin />} />
                <Route path="/student/*" element={<StudentLayout />} />
                <Route path="/register-club" element={<ClubRegister />} />
                <Route path="/login-club" element={<ClubLogin />} />
                <Route path="/login-admin" element={<AdminLogin />} />
                <Route path="/admin/*" element={<AdminLayout />} />
                <Route path="/club/*" element={<ClubLayout />} /> 
            </Routes>
        </Router>
    );
}

function ClubLayout() {
    return (
        <div className={styles.dashboardContainer}> 
            <div className={styles.mainContentArea}> 
                <Routes>
                    <Route path="overview" element={<ClubDashboard />} /> 
                    <Route path="events/*" element={<ClubEventsRoutes />} /> 
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
        <div className={styles.dashboardContainer}> 
            <StudentSidebar />
            <div className={styles.mainContentArea}>
                <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    
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
        <div className={styles.dashboardContainer}> 
            <AdminSidebar />
            <div className={styles.mainContentArea}> 
                <Routes>
                    {/* Admin routes */}
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="events" element={<ManageEvents />} />
                    <Route path="students" element={<ManageStudents />} />
                    <Route path="clubs" element={<ManageClubs />} /> 
                    <Route path="settings" element={<Settings />} />

                </Routes>
            </div>
        </div>
    );
}
export default App;