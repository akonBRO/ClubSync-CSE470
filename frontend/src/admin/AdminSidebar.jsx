import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './AdminSidebar.module.css'; // Create this file
import { FaHome, FaUserShield,FaCalendarAlt, FaUsers, FaBuilding, FaCog, FaSignOutAlt } from 'react-icons/fa'; // Relevant icons for admin

const AdminSidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // TODO: Implement actual backend logout API call here
        // For now, just clear local storage and redirect
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminName'); // Remove admin name too
        // Clear session cookie - this is handled by the browser when the session expires or destroyed server-side
        // But a fetch call to the logout endpoint is required to destroy the session server-side
        fetch('http://localhost:3001/api/admins/logout', {
             method: 'POST',
             credentials: 'include'
        }).then(res => {
            if (res.ok) {
                console.log("Admin logged out successfully (frontend action)");
                 navigate('/login-admin'); // Redirect to admin login page
            } else {
                console.error("Admin logout failed on backend");
                 navigate('/login-admin'); // Still redirect even if backend logout fails frontend
            }
        }).catch(error => {
            console.error("Admin logout fetch error:", error);
             navigate('/login-admin'); // Redirect on network error
        });
    };

    const menuItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: <FaHome className={styles.sidebarNavItemIcon} /> },
        { path: '/admin/events', label: 'Manage Events', icon: <FaCalendarAlt className={styles.sidebarNavItemIcon} /> }, // Optional: Add if needed
        { path: '/admin/students', label: 'Manage Students', icon: <FaUsers className={styles.sidebarNavItemIcon} /> },
        { path: '/admin/clubs', label: 'Manage Clubs', icon: <FaBuilding className={styles.sidebarNavItemIcon} /> },
        
        // { path: '/admin/budgets', label: 'Review Budgets', icon: <FaMoneyBillWave className={styles.sidebarNavItemIcon} /> }, // Optional: Add if needed
        { path: '/admin/settings', label: 'Settings', icon: <FaCog className={styles.sidebarNavItemIcon} /> },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarLogo}>
                {/* Admin specific logo/icon */}
                 <FaUserShield className={styles.sidebarLogoIcon} />
                <span className={styles.sidebarLogoText}>ClubSync</span> {/* Admin specific text */}
            </div>
            <div className={styles.sidebarNav}>
                <div className={styles.adminTools}>Admin Menu</div> {/* Admin specific label */}
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

             {/* Admin specific support or info section */}
            <div className={styles.sidebarSupport}>
                 <p className={styles.sidebarSupportText}>System administration tools.</p>
                 {/* Optional button */}
                 {/* <button className={styles.sidebarSupportButton}>View Documentation</button> */}
             </div>

             {/* Logout button */}
            <button onClick={handleLogout} className={styles.logoutButtonSidebar}>
                <FaSignOutAlt className={styles.logoutButtonSidebarIcon} />
                Logout
            </button>
        </aside>
    );
};

export default AdminSidebar;