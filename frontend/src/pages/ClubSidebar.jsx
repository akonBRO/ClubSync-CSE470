import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './ClubSidebar.module.css';
import {
    FaHome, FaCalendarAlt, FaUserPlus, FaUsers, FaUser, FaCog,
    FaSignOutAlt, FaQuestionCircle, FaShieldAlt // Added FaQuestionCircle for support, FaShieldAlt for logo
} from 'react-icons/fa';

const ClubSidebar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/clubs/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                console.log('Logout successful, redirecting to login.');
                navigate('/login-club'); // Or your designated club login route
            } else {
                const data = await response.json();
                // Consider a more user-friendly notification system than alert
                alert(data?.message || 'Logout failed.');
            }
        } catch (err) {
            console.error('Logout error:', err);
            alert('Logout failed due to a network error.');
        }
    };

    const menuItems = [
        { path: '/club/overview', label: 'Overview', icon: <FaHome /> },
        { path: '/club/events', label: 'Events', icon: <FaCalendarAlt /> },
        { path: '/club/recruitments', label: 'Recruitments', icon: <FaUserPlus /> },
        { path: '/club/members', label: 'Members', icon: <FaUsers /> },
    ];

    const accountMenuItems = [
        { path: '/club/profile', label: 'My Profile', icon: <FaUser /> },
        { path: '/club/settings', label: 'Settings', icon: <FaCog /> },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <FaShieldAlt className={styles.sidebarLogoIcon} /> {/* Changed Icon */}
                <span className={styles.sidebarLogoText}>ClubSync</span>
            </div>

            <nav className={styles.sidebarNav}>
                <h3 className={styles.navSectionTitle}>Main Menu</h3>
                {menuItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${styles.sidebarNavItem} ${isActive ? styles.sidebarNavItemActive : ''}`
                        }
                    >
                        <span className={styles.navItemIcon}>{item.icon}</span>
                        <span className={styles.navItemLabel}>{item.label}</span>
                    </NavLink>
                ))}

                <h3 className={styles.navSectionTitle}>Account</h3>
                 {accountMenuItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${styles.sidebarNavItem} ${isActive ? styles.sidebarNavItemActive : ''}`
                        }
                    >
                        <span className={styles.navItemIcon}>{item.icon}</span>
                        <span className={styles.navItemLabel}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className={styles.sidebarFooter}>
                <div className={styles.sidebarSupportCard}>
                    <FaQuestionCircle className={styles.supportIcon} />
                    <p className={styles.supportText}>Need help with your club dashboard?</p>
                    <button className={styles.supportButton} onClick={() => navigate('/club/support')}> {/* Example navigation */}
                        Contact Support
                    </button>
                </div>

                <button onClick={handleLogout} className={styles.logoutButton}>
                    <FaSignOutAlt className={styles.logoutIcon} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default ClubSidebar;