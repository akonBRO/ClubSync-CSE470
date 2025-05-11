import React, { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import { FaUsers, FaBuilding, FaCalendarCheck, FaMoneyBillWave, FaUserShield, FaChartLine } from 'react-icons/fa';

const AdminDashboard = () => {
    const [adminName, setAdminName] = useState('');
    const [adminId, setAdminId] = useState('');
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalClubs, setTotalClubs] = useState(0);
    const [pendingEventsCount, setPendingEventsCount] = useState(0);
    const [pendingBudgetRequests, setPendingBudgetRequests] = useState(0);
    const [latestPendingEvents, setLatestPendingEvents] = useState([]);
    const [recentClubRegistrations, setRecentClubRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const storedAdminName = localStorage.getItem('adminName');
        const storedAdminId = localStorage.getItem('adminId');

        if (storedAdminName && storedAdminId) {
            setAdminName(storedAdminName || 'Admin');
            setAdminId(storedAdminId);
            fetchAdminDashboardData();
        } else {
            console.warn("No admin session found. Admin dashboard data not fetched.");
            setError("No admin session found. Please log in.");
            setLoading(false);
        }
    }, []);

    const fetchAdminDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch total students count - using admin endpoint
            const studentsRes = await fetch('http://localhost:3001/api/admin/students/count', {
                credentials: 'include'
            });
            if (!studentsRes.ok) throw new Error('Failed to fetch students count');
            const studentsData = await studentsRes.json();
            setTotalStudents(studentsData.count);
    
            // Fetch total clubs count - using admin endpoint
            const clubsRes = await fetch('http://localhost:3001/api/admin/clubs/count', {
                credentials: 'include'
            });
            if (!clubsRes.ok) throw new Error('Failed to fetch clubs count');
            const clubsData = await clubsRes.json();
            setTotalClubs(clubsData.count);

            // Fetch pending events
            const pendingEventsRes = await fetch('http://localhost:3001/api/events/status/Pending', {
                credentials: 'include'
            });
            if (!pendingEventsRes.ok) throw new Error('Failed to fetch pending events');
            const pendingEvents = await pendingEventsRes.json();
            setPendingEventsCount(pendingEvents.length);

            // Format latest pending events
            const formattedPendingEvents = pendingEvents.slice(0, 5).map(event => ({
                id: event._id,
                title: event.event_name,
                club: event.club_name,
                date: new Date(event.event_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            }));
            setLatestPendingEvents(formattedPendingEvents);

            // Fetch budget requests (events with 'Budget' status)
            const budgetRes = await fetch('http://localhost:3001/api/events/status/Budget', {
                credentials: 'include'
            });
            if (!budgetRes.ok) throw new Error('Failed to fetch budget requests');
            const budgetEvents = await budgetRes.json();
            setPendingBudgetRequests(budgetEvents.length);

            // Fetch recent club registrations
            const clubsRegRes = await fetch('http://localhost:3001/api/clubs/recent', {
                credentials: 'include'
            });
            if (!clubsRegRes.ok) throw new Error('Failed to fetch recent clubs');
            const recentClubs = await clubsRegRes.json();
            
            const formattedRecentClubs = recentClubs.map(club => ({
                id: club._id,
                name: club.cname,
                date: new Date(club.cdate || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            }));
            setRecentClubRegistrations(formattedRecentClubs);

        } catch (err) {
            console.error('Error fetching admin dashboard data:', err);
            setError(err.message);
            // Fallback to zero values if API fails
            setTotalStudents(0);
            setTotalClubs(0);
            setPendingEventsCount(0);
            setPendingBudgetRequests(0);
            setLatestPendingEvents([]);
            setRecentClubRegistrations([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className={styles.mainContent}>
                <div className={styles.dashboardContainer}>
                    <p>Loading admin dashboard...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className={styles.mainContent}>
                <div className={styles.dashboardContainer}>
                    <p className={styles.error}>Error: {error}</p>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.mainContent}>
            <div className={styles.dashboardContainer}>
                <header className={styles.header}>
                    <div className={styles.greetingSection}>
                        <h1 className={styles.greeting}>Hello, {adminName}</h1>
                        <p className={styles.adminInfo}>Welcome to the Admin Dashboard</p>
                    </div>
                    <div className={styles.summarySection}>
                        <div className={styles.summaryCard}>
                            <FaUsers className={styles.summaryIcon} />
                            <div className={styles.summaryText}>
                                <span className={styles.summaryValue}>{totalStudents}</span>
                                <span className={styles.summaryLabel}>Total Students</span>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <FaBuilding className={styles.summaryIcon} />
                            <div className={styles.summaryText}>
                                <span className={styles.summaryValue}>{totalClubs}</span>
                                <span className={styles.summaryLabel}>Total Clubs</span>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <FaCalendarCheck className={styles.summaryIcon} />
                            <div className={styles.summaryText}>
                                <span className={styles.summaryValue}>{pendingEventsCount}</span>
                                <span className={styles.summaryLabel}>Pending Events</span>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <FaMoneyBillWave className={styles.summaryIcon} />
                            <div className={styles.summaryText}>
                                <span className={styles.summaryValue}>{pendingBudgetRequests}</span>
                                <span className={styles.summaryLabel}>Budget Requests</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className={styles.dashboardBody}>
                    <section className={styles.leftSection}>
                        <div className={styles.widget}>
                            <h2 className={styles.widgetTitle}><FaCalendarCheck className={styles.widgetIcon} /> Latest Pending Events</h2>
                            {latestPendingEvents.length > 0 ? (
                                <ul className={styles.widgetList}>
                                    {latestPendingEvents.map(event => (
                                        <li key={event.id} className={styles.widgetListItem}>
                                            <span className={styles.listItemTitle}>{event.title}</span>
                                            <span className={styles.listItemMeta}>{event.club} - {event.date}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.noData}>No pending events.</p>
                            )}
                            <button className={styles.viewAllButton}>View All Pending Events</button>
                        </div>

                        <div className={styles.widget}>
                            <h2 className={styles.widgetTitle}><FaBuilding className={styles.widgetIcon} /> Recent Club Registrations</h2>
                            {recentClubRegistrations.length > 0 ? (
                                <ul className={styles.widgetList}>
                                    {recentClubRegistrations.map(club => (
                                        <li key={club.id} className={styles.widgetListItem}>
                                            <span className={styles.listItemTitle}>{club.name}</span>
                                            <span className={styles.listItemMeta}>{club.date}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.noData}>No recent club registrations.</p>
                            )}
                            <button className={styles.viewAllButton}>Manage Clubs</button>
                        </div>
                    </section>

                    <section className={styles.rightSection}>
                        <div className={styles.userProfileWidget}>
                            <div className={styles.profileHeader}>
                                <FaUserShield className={styles.profileIcon} />
                                <h3 className={styles.profileName}>{adminName}</h3>
                            </div>
                            <p className={styles.profileDetail}>Admin ID: {adminId}</p>
                            <button className={styles.viewProfileButton}>View Settings</button>
                        </div>

                        <div className={styles.widget}>
                            <h2 className={styles.widgetTitle}><FaChartLine className={styles.widgetIcon} /> System Overview</h2>
                            <div className={styles.metricsGrid}>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricValue}>{totalStudents}</span>
                                    <span className={styles.metricLabel}>Students</span>
                                </div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricValue}>{totalClubs}</span>
                                    <span className={styles.metricLabel}>Clubs</span>
                                </div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricValue}>{pendingEventsCount}</span>
                                    <span className={styles.metricLabel}>Pending Events</span>
                                </div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricValue}>{pendingBudgetRequests}</span>
                                    <span className={styles.metricLabel}>Budget Requests</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default AdminDashboard;