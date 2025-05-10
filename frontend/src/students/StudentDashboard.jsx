import React, { useState, useEffect } from 'react';
import {Route, BrowserRouter as Router, Switch, Link} from 'react-router-dom';
import styles from './StudentDashboard.module.css';
import { FaCalendarAlt, FaUsers, FaUserCircle, FaBell, FaBullhorn } from 'react-icons/fa';

const StudentDashboard = () => {
    const [studentName, setStudentName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
    const [enrolledClubsCount, setEnrolledClubsCount] = useState(0);
    const [newAnnouncementsCount, setNewAnnouncementsCount] = useState(0);
    const [profileSnapshot, setProfileSnapshot] = useState({});
    const [upcomingEventsList, setUpcomingEventsList] = useState([]);
    const [enrolledClubsList, setEnrolledClubsList] = useState([]);
    const [latestAnnouncementsList, setLatestAnnouncementsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const storedStudentName = localStorage.getItem('studentName');
        const storedStudentId = localStorage.getItem('studentId');

        if (storedStudentName && storedStudentId) {
            setStudentName(storedStudentName || 'Student');
            setStudentId(storedStudentId);
            fetchStudentDashboardData(storedStudentId);
        }
    }, []);

    const fetchStudentDashboardData = async (studentId) => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch student profile data
            const profileResponse = await fetch(`http://localhost:3001/api/students/${studentId}`, {
                credentials: 'include'
            });
            
            if (!profileResponse.ok) {
                throw new Error('Failed to fetch profile data');
            }
            
            const profileData = await profileResponse.json();
            setProfileSnapshot({
                uid: profileData.uid,
                major: profileData.major || 'Not specified',
                semester: profileData.semester || 'Not specified'
            });

            // Fetch enrolled clubs
            const clubsResponse = await fetch(`http://localhost:3001/api/students/${studentId}/myclubs`, {
                credentials: 'include'
            });
            
            if (!clubsResponse.ok) {
                throw new Error('Failed to fetch club data');
            }
            
            const clubsData = await clubsResponse.json();
            setEnrolledClubsList(clubsData.map(club => club.cname));
            setEnrolledClubsCount(clubsData.length);

            // Fetch upcoming events (approved events where student is registered or club events)
            const eventsResponse = await fetch('http://localhost:3001/api/events/status/Approved', {
                credentials: 'include'
            });
            
            if (!eventsResponse.ok) {
                throw new Error('Failed to fetch events data');
            }
            
            const allEvents = await eventsResponse.json();
            
            // Filter events where student is registered or from their clubs
            const studentEvents = allEvents.filter(event => 
                event.reg_std.includes(profileData.uid) || 
                clubsData.some(club => club.cname === event.club_name)
            );
            
            // Format events for display
            const formattedEvents = studentEvents.map(event => ({
                id: event._id,
                title: event.event_name,
                date: new Date(event.event_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                time: event.time_slots[0], // Show first time slot
                location: event.room_number
            }));
            
            setUpcomingEventsList(formattedEvents);
            setUpcomingEventsCount(formattedEvents.length);

            // For announcements, we'll use club announcements (simplified)
            // In a real app, you might have a separate announcements model
            const announcements = allEvents
                .filter(event => clubsData.some(club => club.cname === event.club_name))
                .slice(0, 3) // Get latest 3
                .map(event => ({
                    id: event._id,
                    title: `New Event: ${event.event_name}`,
                    date: new Date(event.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })
                }));
            
            setLatestAnnouncementsList(announcements);
            setNewAnnouncementsCount(announcements.length);

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message);
            // Fallback to dummy data if API fails (remove in production)
            setUpcomingEventsCount(0);
            setEnrolledClubsCount(0);
            setNewAnnouncementsCount(0);
            setProfileSnapshot({ major: 'Error loading data' });
            setUpcomingEventsList([]);
            setEnrolledClubsList([]);
            setLatestAnnouncementsList([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className={styles.mainContent}>
                <div className={styles.dashboardContainer}>
                    <p>Loading dashboard...</p>
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
                        <h1 className={styles.greeting}>Hello, {studentName}</h1>
                        <p className={styles.studentInfo}>{profileSnapshot.major || 'Welcome to your dashboard!'}</p>
                    </div>
                    <div className={styles.summarySection}>
                        <div className={styles.summaryCard}>
                            <FaCalendarAlt className={styles.summaryIcon} />
                            <div className={styles.summaryText}>
                                <span className={styles.summaryValue}>{upcomingEventsCount}</span>
                                <span className={styles.summaryLabel}>Upcoming Events</span>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <FaUsers className={styles.summaryIcon} />
                            <div className={styles.summaryText}>
                                <span className={styles.summaryValue}>{enrolledClubsCount}</span>
                                <span className={styles.summaryLabel}>Enrolled Clubs</span>
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <FaBullhorn className={styles.summaryIcon} />
                            <div className={styles.summaryText}>
                                <span className={styles.summaryValue}>{newAnnouncementsCount}</span>
                                <span className={styles.summaryLabel}>New Announcements</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className={styles.dashboardBody}>
                    <section className={styles.leftSection}>
                        <div className={styles.widget}>
                            <h2 className={styles.widgetTitle}><FaCalendarAlt className={styles.widgetIcon} /> Upcoming Events</h2>
                            {upcomingEventsList.length > 0 ? (
                                <ul className={styles.widgetList}>
                                    {upcomingEventsList.map(event => (
                                        <li key={event.id} className={styles.widgetListItem}>
                                            <span className={styles.listItemTitle}>{event.title}</span>
                                            <span className={styles.listItemMeta}>{event.date} {event.time && `(${event.time})`}</span>
                                            {event.location && <span className={styles.listItemMeta}>Location: {event.location}</span>}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.noData}>No upcoming events.</p>
                            )}
                           <Link to='/student/upcoming-events'> <button className={styles.viewAllButton}>View All Events</button></Link>
                        </div>

                        <div className={styles.widget}>
                            <h2 className={styles.widgetTitle}><FaUsers className={styles.widgetIcon} /> Your Clubs</h2>
                            {enrolledClubsList.length > 0 ? (
                                <div className={styles.clubTagContainer}>
                                    {enrolledClubsList.map(club => (
                                        <span key={club} className={styles.clubTag}>{club}</span>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.noData}>Not enrolled in any clubs yet.</p>
                            )}
                            <Link to='/student/clubs'><button className={styles.viewAllButton}>Explore Clubs</button></Link>
                        </div>
                    </section>

                    <section className={styles.rightSection}>
                        <div className={styles.widget}>
                            <h2 className={styles.widgetTitle}><FaBullhorn className={styles.widgetIcon} /> Latest Announcements</h2>
                            {latestAnnouncementsList.length > 0 ? (
                                <ul className={styles.widgetList}>
                                    {latestAnnouncementsList.map(announcement => (
                                        <li key={announcement.id} className={styles.widgetListItem}>
                                            <span className={styles.listItemTitle}>{announcement.title}</span>
                                            <span className={styles.listItemMeta}>{announcement.date}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.noData}>No new announcements.</p>
                            )}
                            <button className={styles.viewAllButton}>View All Announcements</button>
                        </div>

                        <div className={styles.userProfileWidget}>
                            <div className={styles.profileHeader}>
                                <FaUserCircle className={styles.profileIcon} />
                                <h3 className={styles.profileName}>{studentName}</h3>
                            </div>
                            <p className={styles.profileDetail}>Student ID: {profileSnapshot.uid}</p>
                            <p className={styles.profileDetail}>Major: {profileSnapshot.major || 'N/A'}</p>
                            <p className={styles.profileDetail}>Semester: {profileSnapshot.semester || 'N/A'}</p>
                            <Link to='/student/profile'><button className={styles.viewProfileButton}>View Profile</button></Link>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default StudentDashboard;