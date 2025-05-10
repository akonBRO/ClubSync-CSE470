import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Update imports - using FaSearch from react-icons as used before
import { FaTrash, FaHashtag, FaFileInvoiceDollar, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaInfoCircle, FaCheckCircle, FaUserFriends, FaSearch, FaHourglassHalf, FaExclamationTriangle } from 'react-icons/fa';
import { debounce } from 'lodash'; // Ensure lodash is installed
import './PendingEvents.css'; // Make sure CSS supports search bar

const PendingEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // State for search input

    // --- Fetch Pending Events Function ---
    const fetchPendingEvents = useCallback(async (currentSearchTerm) => {
        setLoading(true);
        setError(null);
        try {
            const clubName = localStorage.getItem('clubName');
            if (!clubName) {
                setError('Club name not found. Please log in again.');
                setLoading(false);
                return;
            }

            // Call the enhanced backend route with search parameter
            const response = await axios.get(
                `http://localhost:3001/api/events/club/${clubName}`,
                {
                    params: { search: currentSearchTerm }, // Pass search term
                    withCredentials: true
                }
            );

            // Backend now sends filtered and sorted data
            setPendingEvents(response.data);

        } catch (err) {
            console.error('Error fetching pending events:', err);
            setError('Failed to load pending events.');
            setPendingEvents([]); // Clear events on error
        } finally {
            setLoading(false);
        }
    }, []); // No navigate needed in deps if only used in handlers triggered by user

    // --- Debounced Fetch ---
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetch = useCallback(
        debounce((term) => {
            fetchPendingEvents(term);
        }, 500), // 500ms delay
        [fetchPendingEvents]
    );

    // --- Effect for fetching based on search term ---
    useEffect(() => {
        debouncedFetch(searchTerm);
        return () => {
            debouncedFetch.cancel(); // Cleanup debounce on unmount
        };
    }, [searchTerm, debouncedFetch]);

    // --- Handle Search Input Change ---
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };


    // --- Delete Handler (no changes needed) ---
    const handleDeleteEvent = async (eventId, eventName) => {
        // Confirmation dialog
        if (window.confirm(`Are you sure you want to delete the event "${eventName}" (ID: ${events.eid})? This action cannot be undone.`)) {
            try {
                // Call the DELETE API using the event's MongoDB _id
                await axios.delete(`http://localhost:3001/api/events/${eventId}`);
                // Update UI by removing the event from the state
                setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
                alert(`Event "${eventName}" deleted successfully.`); // Simple feedback
                navigate(`/club/events/pending`);
            } catch (err) {
                console.error("Error deleting event:", err);
                setError(err.response?.data?.message || "Failed to delete event.");
            }
        }
    };

    // --- Budget Handler (no changes needed) ---
     const handleBudgetClick = (bookingId) => { // Use bookingId to navigate
        console.log("Navigate to budget for bookingId:", bookingId);
        navigate(`/club/events/budget/${bookingId}`);
    };

    // --- Helper function to format date (no changes needed) ---
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
    });
    };


    return (
        // Reuse container class if defined in CSS from other pages
        <div className="pending-events-container approved-events-container modern">
            {/* Header with Title and Search Bar */}
            <header className="approved-events-header modern"> {/* Reuse header class */}
                <h2 className="pending-events-title modern">Pending Event Requests</h2>
                <div className="search-bar modern"> {/* Reuse search bar class */}
                    <FaSearch className="search-icon modern" /> {/* Use FaSearch */}
                    <input
                        type="search"
                        placeholder="Search by Event ID (EID)..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input modern"
                    /> {/* Reuse search input class <-- COMMENT MOVED HERE */}
                </div>
            </header>

             {/* Loading State */}
            {loading && (
            <div className="loading-container modern"> {/* Reuse loading class */}
                <FaHourglassHalf className="spinner modern"/> Loading Pending Events...
            </div>
            )}

        {/* Error State */}
        {error && !loading && (
            <div className="alert alert-error modern"> {/* Reuse alert class */}
                    <FaExclamationTriangle /> {error}
            </div>
            )}


            {/* Event List or No Events Message */}
            {!loading && !error && (
                pendingEvents.length === 0 ? (
                    <p className="no-pending-events modern">
                        No pending event requests found{searchTerm ? ` matching "${searchTerm}"` : ''}.
                    </p>
                ) : (
                    <ul className="pending-events-list modern">
                        {pendingEvents.map((event, index) => (
                            <li key={event.booking_id} className="pending-event-item modern">
                            <div className="event-header modern">
                                <span className="serial-number modern">{index + 1}.</span>
                                <h3 className="event-name modern">{event.event_name}</h3>
                                {/* Dynamic Status Tag */}
                                <span className={`status-tag modern ${event.status.toLowerCase()}`}>
                                    {event.status === 'Budget' ? <FaFileInvoiceDollar/> : <FaCheckCircle />} {event.status}
                                </span>
                            </div>
                            <div className="event-details-grid modern">
                                <div className="detail-item modern"><FaHashtag /> {event.eid}</div>
                                <div className="detail-item modern"><FaCalendarAlt /> {formatDateTime(event.event_date)}</div>
                                <div className="detail-item modern"><FaClock /> {Array.isArray(event.time_slots) ? event.time_slots.join(', ') : event.time_slot}</div>
                                <div className="detail-item modern"><FaMapMarkerAlt /> {event.room_number}</div>
                                <div className="detail-item modern"><FaUserFriends /> Reg: {event.std_reg}</div>
                                <div className="detail-item details-long modern"><FaInfoCircle /> {event.event_details}</div>

                                {/* *** ADD THIS SECTION BACK / VERIFY IT EXISTS *** */}
                                 {event.comments && ( // Conditionally render comments if they exist
                                    <div className="detail-item comments-long modern">
                                        {/* Optional: Add an icon like FaCommentAlt or similar if desired */}
                                        <strong>OCA Comments:</strong> {event.comments}
                                    </div>
                                )}
                                {/* *** END OF COMMENTS SECTION *** */}

                            </div>
                            <div className="event-actions modern">
                                <button
                                    className="budget-button modern"
                                    onClick={() => handleBudgetClick(event.booking_id)} // Pass booking_id
                                >
                                    <FaFileInvoiceDollar /> Budget
                                </button>
                                <button
                                    className="delete-button modern"
                                    onClick={() => handleDeleteEvent(event._id, event.event_name)} // Pass booking_id
                                >
                                    <FaTrash /> Delete
                                </button>
                            </div>
                        </li>
                        ))}
                    </ul>
                )
            )}
        </div>
    );
};

export default PendingEvents;