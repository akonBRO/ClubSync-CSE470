import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './StudentSidebar.module.css';
import { FaHome, FaBook, FaCalendarAlt, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa'; // Relevant icons

const StudentSidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('studentId');
        localStorage.removeItem('studentName');
        navigate('/login-student');
    };

    const menuItems = [
        { path: '/student/dashboard', label: 'Dashboard', icon: <FaHome className={styles.sidebarNavItemIcon} /> },
        { path: '/student/clubs', label: 'Clubs', icon: <FaBook className={styles.sidebarNavItemIcon} /> },
        { path: '/student/upcoming-events', label: 'Events', icon: <FaCalendarAlt className={styles.sidebarNavItemIcon} /> },
        { path: '/student/profile', label: 'Profile', icon: <FaUser className={styles.sidebarNavItemIcon} /> },
        { path: '/student/settings', label: 'Settings', icon: <FaCog className={styles.sidebarNavItemIcon} /> },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarLogo}>
                {/* You can add a student-specific logo here */}
                <FaBook className={styles.sidebarLogoIcon} />
                <span className={styles.sidebarLogoText}>ClubSync</span>
            </div>
            <div className={styles.sidebarNav}>
                <div className={styles.adminTools}>Student Menu</div>
                <nav>
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `${styles.sidebarNavItem} ${isActive ? styles.sidebarNavItemActive : ''}`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className={styles.sidebarSupport}>
                <p className={styles.sidebarSupportText}>Need help navigating your portal?</p>
                <button className={styles.sidebarSupportButton}>Contact Support</button>
            </div>
            <button onClick={handleLogout} className={styles.logoutButtonSidebar}>
                <FaSignOutAlt className={styles.logoutButtonSidebarIcon} />
                Logout
            </button>
        </aside>
    );
};

export default StudentSidebar;