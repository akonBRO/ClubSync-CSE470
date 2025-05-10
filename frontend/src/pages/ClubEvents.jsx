// pages/ClubEvents.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import styles from './ClubEvents.module.css';
import { FaPlusCircle, FaCheckCircle, FaClock, FaBan, FaCalendarAlt, FaChartBar } from 'react-icons/fa';

const ClubEvents = () => {
    const navigate = useNavigate();

    const [approvedCount, setApprovedCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0); // Will be 0 as per /api/clubs/dashboard
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClubEventData = async () => {
            setLoading(true);
            setError(null);
            // Assuming clubAuth routes are mounted at /api/clubs
            // Adjust if your backend routes are set up differently
            const DASHBOARD_API_URL = 'http://localhost:3001/api/clubs/dashboard';

            try {
                const response = await fetch(DASHBOARD_API_URL, {
                    credentials: 'include', // Crucial for sending session cookies
                });

                if (!response.ok) {
                    let errorMessage = `Error: ${response.status} ${response.statusText}`;
                    if (response.status === 401) {
                        errorMessage = 'Unauthorized. Please ensure you are logged in.';
                        // Optional: redirect to login page if navigate is available and desired
                        // navigate('/login'); 
                    }
                    const errorData = await response.json().catch(() => null); // Try to get error message from body
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                    throw new Error(errorMessage);
                }

                const data = await response.json();

                // From /api/clubs/dashboard:
                // data.upcomingEventsCount refers to approved events (upcoming)
                // data.pendingEventsCount refers to pending events (upcoming)
                // No club-specific rejected count is provided by this endpoint.

                setApprovedCount(data.upcomingEventsCount || 0);
                setPendingCount(data.pendingEventsCount || 0);
                
                // Rejected count is not provided by /api/clubs/dashboard for the specific club.
                // Setting to 0. If a club-specific rejected count is needed, 
                // the backend /api/clubs/dashboard or a new endpoint should provide it.
                setRejectedCount(0); 

            } catch (err) {
                console.error("Error fetching club event data:", err);
                setError(err.message);
                // Set counts to 0 on any error
                setApprovedCount(0);
                setPendingCount(0);
                setRejectedCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchClubEventData();
    }, []); // Removed navigate from dependency array as it's not directly called in this version

    const handleCreateNewEvent = () => {
        navigate("booking");
    };
    
    // For debugging purposes, you can log loading and error states
    if (loading) {
        console.log("ClubEvents: Loading dashboard data...");
    }
    if (error) {
        console.error("ClubEvents: Error fetching data - ", error);
        // You could display an error message in the UI if desired
        // For example: return <p>Error loading event data: {error}</p>;
        // But to keep UI changes minimal as per original request, just logging.
    }

    return (
        <div className={styles.eventsContainer}>
            <div className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <h2 className={styles.heroTitle}>Event Dashboard</h2>
                    <p className={styles.heroSubtitle}>Manage and organize all your club's events effectively.</p>
                    <button className={styles.primaryButton} onClick={handleCreateNewEvent}>
                        <FaPlusCircle className={styles.buttonIcon} />
                        Create New Event
                    </button>
                </div>
                <div className={styles.heroImage}>
                    <FaCalendarAlt className={styles.heroIcon} />
                </div>
            </div>

            <div className={styles.analyticsSection}>
                <h3 className={styles.analyticsTitle}>Quick Analytics </h3>
                <div className={styles.analyticsGrid}>
                    <div className={`${styles.analyticsCard} ${styles.approved}`}>
                        <FaCheckCircle className={styles.analyticsIcon} />
                        <span className={styles.analyticsLabel}>Approved</span>
                        <span className={styles.analyticsCount}>{approvedCount}</span>
                    </div>
                    <div className={`${styles.analyticsCard} ${styles.pending}`}>
                        <FaClock className={styles.analyticsIcon} />
                        <span className={styles.analyticsLabel}>Pending</span>
                        <span className={styles.analyticsCount}>{pendingCount}</span>
                    </div>
                    <div className={`${styles.analyticsCard} ${styles.rejected}`}>
                        <FaBan className={styles.analyticsIcon} />
                        <span className={styles.analyticsLabel}>Rejected</span>
                        <span className={styles.analyticsCount}>{rejectedCount}</span>
                        {/* Note: Rejected count is 0 as it's not club-specific from /api/clubs/dashboard */}
                    </div>
                    <div className={styles.analyticsCard}>
                        <FaChartBar className={styles.analyticsIcon} />
                        <span className={styles.analyticsLabel}>Total Tracked</span>
                        <span className={styles.analyticsCount}>{approvedCount + pendingCount + rejectedCount}</span>
                    </div>
                </div>
            </div>

            <nav className={styles.eventsNav}>
                <NavLink
                    to="booking"
                    className={({ isActive }) => isActive ? styles.activeTab : styles.tab}
                >
                    <div className={styles.navItem}>
                        <FaPlusCircle className={styles.tabIcon} />
                        Book Event
                    </div>
                </NavLink>
                <NavLink
                    to="approved"
                    className={({ isActive }) => isActive ? styles.activeTab : styles.tab}
                >
                    <div className={styles.navItem}>
                        <FaCheckCircle className={`${styles.tabIcon} ${styles.approvedColor}`} />
                        Approved Events
                        <span className={styles.tabCount}>{approvedCount}</span>
                    </div>
                </NavLink>
                <NavLink
                    to="pending"
                    className={({ isActive }) => isActive ? styles.activeTab : styles.tab}
                >
                    <div className={styles.navItem}>
                        <FaClock className={`${styles.tabIcon} ${styles.pendingColor}`} />
                        Pending Events
                        <span className={styles.tabCount}>{pendingCount}</span>
                    </div>
                </NavLink>
                <NavLink
                    to="rejected"
                    className={({ isActive }) => isActive ? styles.activeTab : styles.tab}
                >
                    <div className={styles.navItem}>
                        <FaBan className={`${styles.tabIcon} ${styles.rejectedColor}`} />
                        Rejected Events
                        <span className={styles.tabCount}>{rejectedCount}</span>
                    </div>
                </NavLink>
            </nav>

            <div className={styles.outletContainer}>
                <Outlet />
            </div>
        </div>
    );
};

export default ClubEvents;