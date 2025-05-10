import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ClubDashboard.module.css';
import {
    FaUsers,
    FaCalendarCheck,
    FaBullhorn,
    FaMoneyBillAlt,
    FaUserCircle,
    FaChevronRight,
    FaUpload,
    FaSearch,
    FaBell,
    FaCalendarPlus,
    FaUserPlus,
    FaChartLine,
    FaTasks,
    FaHistory,
    FaCog,
    FaPlusCircle,
    FaArrowRight
} from 'react-icons/fa';
import { MdOutlineWavingHand } from "react-icons/md";

const ClubDashboard = () => {
    const navigate = useNavigate();

    // Initialize states that will be fetched from backend
    const [clubInfo, setClubInfo] = useState(null); // For club name and basic details
    const [totalMembers, setTotalMembers] = useState(0);
    const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
    const [pendingEventsCount, setPendingEventsCount] = useState(0);
    const [activeAnnouncementsCount, setActiveAnnouncementsCount] = useState(0); // Still dummy/placeholder
    const [recruitmentStatus, setRecruitmentStatus] = useState('Loading...'); // Initial state
    const [totalApplicants, setTotalApplicants] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Dummy Data (kept for sections not covered by backend fetch) ---
    // Recruitment status style logic now uses the fetched recruitmentStatus state
    const recruitmentStatusStyle = {
        color: recruitmentStatus === 'Recruiting' ? '#22c55e' : (recruitmentStatus === 'Not Recruiting' ? '#dc2626' : '#f97316'), // Green, Red, or Orange/Yellow for loading/unknown
        fontWeight: 'bold',
    };

    const applicantsCountStyle = {
        color: '#3b82f6', // Blue color for applicants count
        fontWeight: 'bold',
    };

    // Recent Activities (Still dummy - requires backend logic/model)
    const recentActivities = [
        { id: 1, text: 'New applicant registered: John Doe', type: 'applicant' },
        { id: 2, text: 'Event "Annual General Meeting" created', type: 'event' },
        { id: 3, text: 'Announcement "Call for Volunteers" posted', type: 'announcement' },
        { id: 4, text: 'Membership fee received from Jane Smith', type: 'finance' },
    ];

    // Quick Actions (Hardcoded, no backend data needed)
    const quickActions = [
        { id: 1, label: 'Create New Event', icon: <FaCalendarPlus />, link: '/events/create' }, // Adjusted link based on common routing patterns
        { id: 2, label: 'Add New Member', icon: <FaUserPlus />, link: '/members/add' }, // Adjusted link
        { id: 3, label: 'Post Announcement', icon: <FaBullhorn />, link: '/announcements/create' }, // Adjusted link
        { id: 4, label: 'Manage Finances', icon: <FaMoneyBillAlt />, link: '/finances' }, // Adjusted link
    ];
    // -------------------------------------------------------------------


    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null); // Clear previous errors
            try {
                const response = await fetch('http://localhost:3001/api/clubs/dashboard', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include' // Include cookies for session handling
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        console.log('Unauthorized access to dashboard, redirecting to login.');
                        navigate('/login-club'); // Redirect to login on unauthorized
                        return;
                    }
                     if (response.status === 404) {
                         console.error('Club data not found on dashboard route.');
                         // Optionally display a more specific error message
                         setError('Club data not found. Please try logging in again.');
                         setLoading(false);
                         setClubInfo({ clubName: 'Club' }); // Default name even if data missing
                         return;
                     }
                    const errorData = await response.json();
                    throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Fetched dashboard data:', data); // Log fetched data

                // Update state with fetched data
                setClubInfo({
                    clubName: data.clubName,
                    clubId: data.clubId,
                    clubCid: data.clubCid,
                    // Add any other club details you want to store in state
                });

                setTotalMembers(data.totalMembers !== undefined ? data.totalMembers : 0);
                setUpcomingEventsCount(data.upcomingEventsCount !== undefined ? data.upcomingEventsCount : 0);
                setPendingEventsCount(data.pendingEventsCount !== undefined ? data.pendingEventsCount : 0);
                 // Keep announcements dummy for now
                // setActiveAnnouncementsCount(data.activeAnnouncementsCount !== undefined ? data.activeAnnouncementsCount : 0); // Use if backend provides
                setRecruitmentStatus(data.recruitmentStatus || 'Unknown'); // Default to 'Unknown' if status is missing
                setTotalApplicants(data.totalApplicants !== undefined ? data.totalApplicants : 0);
                setCurrentBalance(data.currentBalance !== undefined ? data.currentBalance : 0);

                // Note: recentActivities and activeAnnouncementsCount are not coming from backend yet

                setLoading(false);

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message || 'Failed to load dashboard data.');
                setLoading(false);
                 // Set a default club name even on error for better UX
                if (!clubInfo) { // Only set if clubInfo is still null
                    setClubInfo({ clubName: 'Club' });
                }
                 // Keep other states as their initial default (0 or 'Loading...') on fetch error
            }
        };

        fetchDashboardData();
    }, [navigate]); // Dependency array includes navigate

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p className={styles.loadingText}>Loading dashboard...</p>
            </div>
        );
    }

     // Show a prominent error if the initial fetch failed completely and no data is loaded
     if (error && !clubInfo?.clubId) { // Check if clubInfo or clubId is missing
         return <div className={styles.errorContainer}>Error loading dashboard: {error}</div>;
     }

    // Render dashboard, potentially with partial/stale data and a soft error message
    return (
        <main className={styles.dashboardMain}>
            <div className={styles.dashboardContainerInner}>
                <header className={styles.header}>
                    <div className={styles.headerWelcome}>
                        <MdOutlineWavingHand className={styles.wavingHandIcon} /> Hello, <span className={styles.headerUserName}>{clubInfo?.clubName || 'Club'}</span>{/* Use fetched club name or fallback */}
                        <p className={styles.headerSubtitle}>Welcome to your dashboard overview.</p>
                    </div>
                    <div className={styles.headerActions}>
                         <div className={styles.searchBar}>
                             <FaSearch className={styles.searchIcon} />
                             <input type="text" placeholder="Search..." className={styles.searchInput} />
                         </div>
                        {/* Assuming Upload Document and Notification are standard features */}
                        
                        <div className={styles.notificationIcon}>
                             <FaBell />
                             <span className={styles.notificationBadge}>2</span> {/* Still dummy notification count */}
                        </div>
                         <div className={styles.userProfileIcon}>
                             <FaUserCircle /> {/* Placeholder for user profile */}
                         </div>
                    </div>
                </header>

                 {/* Soft error notification if data fetch failed but component could still render */}
                {error && clubInfo?.clubId && (
                     <div className={styles.softError}>
                         <p>Could not fully update dashboard data: {error}</p>
                     </div>
                )}


                <section className={styles.statsOverview}>
                    <h2 className={styles.sectionTitle}>Overview</h2>
                    <div className={styles.statsGrid}>
                        {/* Total Members Card */}
                        <div className={styles.dashboardCard}>
                            <div className={styles.cardHeader}>
                                <FaUsers className={styles.cardIcon} />
                                <span className={styles.cardTitle}>Total Members</span>
                            </div>
                            <div className={styles.cardValue}>{totalMembers}</div> {/* Use fetched totalMembers */}
                            {/* <div className={styles.cardTrend}>+5 new members this week</div> Placeholder */}
                            {/* Add a link/button to view all members */}
                            <button className={styles.cardLink} onClick={() => navigate('/club/members')}>View Members <FaArrowRight className={styles.cardLinkArrow}/></button>
                        </div>

                        {/* Upcoming Events Card */}
                        <div className={styles.dashboardCard}>
                            <div className={styles.cardHeader}>
                                <FaCalendarCheck className={styles.cardIcon} />
                                <span className={styles.cardTitle}>Upcoming Events</span>
                            </div>
                            <div className={styles.cardValue}>{upcomingEventsCount}</div> {/* Use fetched upcomingEventsCount */}
                            <button className={styles.cardLink} onClick={() => navigate('/club/events/approved')}>View Schedule <FaArrowRight className={styles.cardLinkArrow}/></button>
                        </div>

                        {/* Pending Events Card */}
                        <div className={styles.dashboardCard}>
                            <div className={styles.cardHeader}>
                                <FaCalendarPlus className={styles.cardIcon} />
                                <span className={styles.cardTitle}>Pending Events</span>
                            </div>
                            <div className={styles.cardValue}>{pendingEventsCount}</div> {/* Use fetched pendingEventsCount */}
                             <button className={styles.cardLink} onClick={() => navigate('/club/events/pending')}>Manage Events <FaArrowRight className={styles.cardLinkArrow}/></button> {/* Adjusted link */}
                        </div>

                        {/* Active Announcements Card (Still dummy) */}
                        <div className={styles.dashboardCard}>
                            <div className={styles.cardHeader}>
                                <FaBullhorn className={styles.cardIcon} />
                                <span className={styles.cardTitle}>Active Announcements</span>
                            </div>
                            <div className={styles.cardValue}>{activeAnnouncementsCount}</div> {/* Still dummy/placeholder */}
                            <button className={styles.cardLink} onClick={() => navigate('/announcements')}>See Details <FaArrowRight className={styles.cardLinkArrow}/></button>
                        </div>

                         {/* Recruitment Status Card */}
                         <div className={styles.dashboardCard}>
                            <div className={styles.cardHeader}>
                                <FaUserPlus className={styles.cardIcon} />
                                <span className={styles.cardTitle}>Recruitment Status</span>
                            </div>
                            <div className={styles.cardValue} style={recruitmentStatusStyle}>{recruitmentStatus}</div> {/* Use fetched recruitmentStatus */}
                             <div className={styles.cardTrend}>Total Applicants: <span style={applicantsCountStyle}>{totalApplicants}</span></div> {/* Use fetched totalApplicants */}
                         </div>

                         {/* Club Funds Card */}
                         <div className={`${styles.dashboardCard} ${styles.balanceCard}`}>
                             <div className={styles.cardHeader}>
                                 <FaMoneyBillAlt className={styles.cardIcon} />
                                 <span className={styles.cardTitle}>Club Funds</span>
                             </div>
                             <div className={styles.balanceValue}>৳{currentBalance}</div> {/* Use fetched currentBalance */}
                             <button className={styles.cardLink} onClick={() => navigate('/finances')}>Manage Funds <FaArrowRight className={styles.cardLinkArrow}/></button> {/* Adjusted link */}
                         </div>

                    </div>
                </section>

                    <section className={styles.additionalSections}>
                     {/* Recent Activity Card (Still dummy) */}
                     <div className={styles.recentActivityCard}>
                         <h2 className={styles.sectionTitle}><FaHistory className={styles.sectionTitleIcon}/> Recent Activity</h2>
                         <ul className={styles.activityList}>
                              {recentActivities.map(activity => (
                                  <li key={activity.id} className={styles.activityItem}>
                                      <span className={`${styles.activityTypeBadge} ${styles[activity.type]}`}>
                                          {activity.type.charAt(0).toUpperCase()} {/* Displays first letter */}
                                      </span>
                                      {activity.text}
                                  </li>
                              ))}
                             {recentActivities.length === 0 && <li className={styles.noActivity}>No recent activity.</li>}
                         </ul>
                         <button className={styles.viewAllButton}>View All Activity <FaChevronRight /></button>
                     </div>

                     {/* Quick Actions Card */}
                      <div className={styles.quickActionsCard}>
                         <h2 className={styles.sectionTitle}><FaTasks className={styles.sectionTitleIcon}/> Quick Actions</h2>
                          <div className={styles.quickActionsGrid}>
                              {quickActions.map(action => (
                                  <button key={action.id} className={styles.quickActionButton} onClick={() => navigate(action.link)}>
                                      {action.icon}
                                      <span>{action.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>
                    </section>

            </div>
        </main>
    );
};

export default ClubDashboard;