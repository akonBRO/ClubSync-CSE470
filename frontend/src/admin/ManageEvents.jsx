import React, { useState, useEffect } from 'react';
import styles from './ManageEvents.module.css';
import {
    FaSearch, FaFilter, FaEdit, FaMoneyBillWave, FaSyncAlt, FaHourglassHalf,
    FaCheckCircle, FaTimesCircle, FaWallet, FaCalendarAlt, FaClock, FaUsers,
    FaInfoCircle, FaBuilding, FaCommentDots, FaListAlt, FaExclamationTriangle, FaSpinner
} from 'react-icons/fa';
import AdminBudgetModal from './AdminBudgetModal';
import axios from 'axios';

const ManageEvents = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClub, setSelectedClub] = useState('All Clubs');
    const [selectedStatus, setSelectedStatus] = useState('All Statuses');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [clubs, setClubs] = useState(['All Clubs']);
    const [statusCounts, setStatusCounts] = useState({
        Pending: 0,
        Approved: 0,
        Rejected: 0,
        Budget: 0,
    });

    const eventStatuses = ['All Statuses', 'Pending', 'Approved', 'Rejected', 'Budget'];

    useEffect(() => {
        fetchEvents();
        fetchEventCounts();
    }, [selectedClub, selectedStatus]);

    useEffect(() => {
        applySearchFilter();
    }, [events, searchTerm]);

    const fetchEvents = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (selectedClub !== 'All Clubs') {
                params.append('clubName', selectedClub);
            }
            if (selectedStatus !== 'All Statuses') {
                params.append('status', selectedStatus);
            }
            const response = await axios.get('http://localhost:3001/api/admins/events', {
                params: params,
                withCredentials: true
            });
            setEvents(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError(err.response?.data?.message || 'Failed to fetch events. Please try refreshing.');
            setLoading(false);
        }
    };

    const fetchEventCounts = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/admins/events/counts', {
                withCredentials: true
            });
            setStatusCounts(response.data);
        } catch (err) {
            console.error('Error fetching event counts:', err);
            // Optionally set an error state for counts if needed
        }
    };

    const fetchClubNames = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/admins/events/club-names', {
                withCredentials: true
            });
            const uniqueClubNames = ['All Clubs', ...response.data];
            setClubs(uniqueClubNames);
        } catch (err) {
            console.error('Error fetching club names:', err);
            setClubs(['All Clubs']);
            setError(prevError => prevError + (prevError ? ' ' : '') + 'Failed to load club names for filter.');
        }
    }

    useEffect(() => {
        fetchClubNames();
    }, []);

    const applySearchFilter = () => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const filtered = events.filter(event => {
            const matchesSearch = event.eid.toLowerCase().includes(lowerCaseSearchTerm) ||
                event.event_name.toLowerCase().includes(lowerCaseSearchTerm) ||
                (event.club_name && event.club_name.toLowerCase().includes(lowerCaseSearchTerm));
            return matchesSearch;
        });
        setFilteredEvents(filtered);
    };

    const handleInlineStatusChange = async (eventId, newStatus) => {
        const originalEvents = [...events];
        const updatedEvents = events.map(event =>
            event._id === eventId ? { ...event, status: newStatus } : event
        );
        setEvents(updatedEvents);
        // Optimistically update filteredEvents as well
        setFilteredEvents(prevFiltered => prevFiltered.map(event =>
            event._id === eventId ? { ...event, status: newStatus } : event
        ));

        try {
            await axios.put(`http://localhost:3001/api/admins/events/${eventId}/status`, { status: newStatus }, {
                withCredentials: true
            });
            fetchEventCounts(); // Refresh counts
        } catch (err) {
            console.error('Error updating event status inline:', err);
            setError('Failed to update event status. Reverting change.');
            setEvents(originalEvents); // Revert on error
             setFilteredEvents(prevFiltered => { // Also revert filtered events based on original events
                const originalFiltered = originalEvents.filter(event => {
                     const lowerCaseSearchTerm = searchTerm.toLowerCase();
                     const matchesSearch = event.eid.toLowerCase().includes(lowerCaseSearchTerm) ||
                                         event.event_name.toLowerCase().includes(lowerCaseSearchTerm) ||
                                         (event.club_name && event.club_name.toLowerCase().includes(lowerCaseSearchTerm));
                     return matchesSearch;
                });
                return originalFiltered;
            });
        }
    };

    const handleInlineCommentChange = async (eventId, newComments) => {
        const originalEvents = [...events];
        const updatedEvents = events.map(event =>
            event._id === eventId ? { ...event, comments: newComments } : event
        );
        setEvents(updatedEvents);
        setFilteredEvents(prevFiltered => prevFiltered.map(event =>
            event._id === eventId ? { ...event, comments: newComments } : event
        ));
        
        try {
            await axios.put(`http://localhost:3001/api/admins/events/${eventId}/status`, { comments: newComments }, {
                withCredentials: true
            });
        } catch (err) {
            console.error('Error updating event comments inline:', err);
            setError('Failed to update event comments. Some changes might not be saved.');
            // Consider a more sophisticated revert or re-fetch for comments
            setEvents(originalEvents);
             setFilteredEvents(prevFiltered => {
                const originalFiltered = originalEvents.filter(event => {
                     const lowerCaseSearchTerm = searchTerm.toLowerCase();
                     const matchesSearch = event.eid.toLowerCase().includes(lowerCaseSearchTerm) ||
                                         event.event_name.toLowerCase().includes(lowerCaseSearchTerm) ||
                                         (event.club_name && event.club_name.toLowerCase().includes(lowerCaseSearchTerm));
                     return matchesSearch;
                });
                return originalFiltered;
            });
        }
    };

    const openBudgetModal = (eventId) => {
        setSelectedEventId(eventId);
        setIsModalOpen(true);
    };

    const closeBudgetModal = () => {
        setIsModalOpen(false);
        setSelectedEventId(null);
        fetchEvents();
        fetchEventCounts();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <FaHourglassHalf className={`${styles.statusIcon} ${styles.pendingIcon}`} />;
            case 'Approved': return <FaCheckCircle className={`${styles.statusIcon} ${styles.approvedIcon}`} />;
            case 'Rejected': return <FaTimesCircle className={`${styles.statusIcon} ${styles.rejectedIcon}`} />;
            case 'Budget': return <FaWallet className={`${styles.statusIcon} ${styles.budgetIcon}`} />;
            default: return null;
        }
    };
    
    const handleRefresh = () => {
        setSearchTerm('');
        setSelectedClub('All Clubs');
        setSelectedStatus('All Statuses');
        // useEffect will trigger fetchEvents and fetchEventCounts due to selectedClub/Status change
        // but to ensure immediate fetch if filters were already at default:
        if (selectedClub === 'All Clubs' && selectedStatus === 'All Statuses') {
            fetchEvents();
            fetchEventCounts();
        }
    };


    return (
        <div className={styles.manageEventsPage}>
            <header className={styles.pageHeader}>
                <h1>Event Dashboard</h1>
                <p>Oversee and manage all club event proposals and statuses.</p>
            </header>

            {/* Status Counts Section */}
            <section className={styles.statusCountsSection}>
                <div className={styles.statusCard}>
                    <FaHourglassHalf className={`${styles.countIcon} ${styles.countIconPending}`} />
                    <div className={styles.countDetails}>
                        <span>Pending Review</span>
                        <strong>{statusCounts.Pending || 0}</strong>
                    </div>
                </div>
                <div className={styles.statusCard}>
                    <FaWallet className={`${styles.countIcon} ${styles.countIconBudget}`} />
                    <div className={styles.countDetails}>
                        <span>Budget Review</span>
                        <strong>{statusCounts.Budget || 0}</strong>
                    </div>
                </div>
                <div className={styles.statusCard}>
                    <FaCheckCircle className={`${styles.countIcon} ${styles.countIconApproved}`} />
                    <div className={styles.countDetails}>
                        <span>Approved</span>
                        <strong>{statusCounts.Approved || 0}</strong>
                    </div>
                </div>
                <div className={styles.statusCard}>
                    <FaTimesCircle className={`${styles.countIcon} ${styles.countIconRejected}`} />
                    <div className={styles.countDetails}>
                        <span>Rejected</span>
                        <strong>{statusCounts.Rejected || 0}</strong>
                    </div>
                </div>
            </section>

            {/* Controls Section */}
            <section className={styles.controlsSection}>
                <div className={styles.searchBarWrapper}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by Event ID, Name, Club..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.filtersWrapper}>
                    <div className={styles.filterGroup}>
                        <FaBuilding className={styles.filterIcon} />
                        <select
                            id="clubFilter"
                            value={selectedClub}
                            onChange={(e) => setSelectedClub(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {clubs.map(club => (
                                <option key={club} value={club}>{club}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <FaListAlt className={styles.filterIcon} />
                        <select
                            id="statusFilter"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {eventStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleRefresh} className={styles.refreshButton} title="Refresh Events and Filters">
                        <FaSyncAlt /> Refresh
                    </button>
                </div>
            </section>
            
            {error && (
                <div className={styles.errorMessage}>
                    <FaExclamationTriangle /> {error}
                </div>
            )}

            {/* Events Table Section */}
            <section className={styles.eventsTableSection}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <FaSpinner className={styles.spinnerIcon} />
                        <p>Loading events, please wait...</p>
                    </div>
                ) : !error && filteredEvents.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaInfoCircle className={styles.emptyIcon} />
                        <p>No events found matching your criteria.</p>
                        <p>Try adjusting your search or filters.</p>
                    </div>
                ) : !error && filteredEvents.length > 0 ? (
                    <div className={styles.eventsTableContainer}>
                        <table className={styles.eventsTable}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Event Name</th>
                                    <th>Club</th>
                                    <th><FaCalendarAlt /> Date</th>
                                    <th><FaClock /> Time Slots</th>
                                    <th>Room</th>
                                    <th><FaUsers /> Registrations</th>
                                    <th>Details</th>
                                    <th>Status</th>
                                    <th><FaCommentDots /> Admin Comments</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEvents.map(event => (
                                    <tr key={event._id} className={styles.eventRow}>
                                        <td>{event.eid}</td>
                                        <td className={styles.eventNameCell}>{event.event_name}</td>
                                        <td>{event.club_name}</td>
                                        <td>{new Date(event.event_date).toLocaleDateString()}</td>
                                        <td className={styles.timeSlotsCell}>
                                            {Array.isArray(event.time_slots) ? event.time_slots.join(', ') : 'N/A'}
                                        </td>
                                        <td>{event.room_number || 'N/A'}</td>
                                        <td className={styles.registrationsCell}>
                                            {Array.isArray(event.reg_std) ? event.reg_std.length : 0}
                                        </td>
                                        <td className={styles.eventDetailsCell}>
                                            <div className={styles.detailsContent}>
                                                {event.event_details}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.statusEditor}>
                                                {getStatusIcon(event.status)}
                                                <select
                                                    value={event.status}
                                                    onChange={(e) => handleInlineStatusChange(event._id, e.target.value)}
                                                    className={`${styles.statusSelect} ${styles[event.status.toLowerCase()]}`}
                                                >
                                                    {eventStatuses.slice(1).map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td>
                                            <textarea
                                                value={event.comments || ''}
                                                onChange={(e) => handleInlineCommentChange(event._id, e.target.value)}
                                                className={styles.commentsTextarea}
                                                rows="3"
                                                placeholder="Add comments..."
                                            />
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => openBudgetModal(event._id)}
                                                className={styles.actionButtonBudget}
                                                title="Review Budget Details"
                                                disabled={event.status === 'Rejected'} // Example: disable if rejected
                                            >
                                                <FaMoneyBillWave /> Budget
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </section>

            {isModalOpen && selectedEventId && (
                <AdminBudgetModal
                    eventId={selectedEventId}
                    onClose={closeBudgetModal}
                />
            )}
        </div>
    );
};

export default ManageEvents;