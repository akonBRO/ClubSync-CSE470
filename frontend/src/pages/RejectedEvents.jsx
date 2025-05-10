import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
// Keep useNavigate if you have other navigation, otherwise remove if only delete is left
// import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, FileText, Trash2, Search, MessageSquare, Loader, AlertTriangle } from 'lucide-react'; // Removed Eye, Added MessageSquare
import { debounce } from 'lodash';
import './RejectedEvents.css'; // Import the new CSS file

// Rename component
const RejectedEventsPage = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    // const navigate = useNavigate(); // Remove if not used

    // --- Fetch Rejected Events Function ---
    const fetchRejectedEvents = useCallback(async (currentSearchTerm) => { // Renamed function
        setIsLoading(true);
        setError('');
        try {
            // Fetch 'Rejected' status events
            const response = await axios.get(`http://localhost:3001/api/events/status/Rejected`, { // <<< CHANGED STATUS
                params: { search: currentSearchTerm }
            });
            setEvents(response.data);
        } catch (err) {
            console.error("Error fetching rejected events:", err);
            setError(err.response?.data?.message || "Failed to load rejected events. Please try again.");
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- Debounced Fetch Function (No changes needed) ---
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetch = useCallback(
        debounce((term) => {
            fetchRejectedEvents(term); // Call renamed function
        }, 500),
        [fetchRejectedEvents]
    );

    // --- Initial Fetch and Fetch on Search Term Change (No changes needed) ---
    useEffect(() => {
        debouncedFetch(searchTerm);
        return () => {
            debouncedFetch.cancel();
        };
    }, [searchTerm, debouncedFetch]);

    // --- Handle Search Input Change (No changes needed) ---
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // --- Handle Delete (No changes needed, logic is the same) ---
    const handleDelete = async (eventId, eventName) => {
        if (window.confirm(`Are you sure you want to delete the rejected event request "${eventName}" (ID: ${eventId})?`)) {
            try {
                await axios.delete(`http://localhost:3001/api/events/${eventId}`);
                setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
                alert(`Rejected event "${eventName}" deleted successfully.`);
            } catch (err) {
                console.error("Error deleting rejected event:", err);
                setError(err.response?.data?.message || "Failed to delete rejected event.");
            }
        }
    };

    // --- REMOVE Handle View Budget Navigation ---
    // const handleViewBudget = (bookingId) => { ... }; // Delete this function

    // --- Helper function to format date (No changes needed) ---
    const formatDateTime = (dateString) => {
        // ... (keep existing formatting logic) ...
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        // Use specific container class if desired, or reuse the approved one
        <div className="rejected-events-container approved-events-container">
            <header className="approved-events-header"> {/* Reuse header class */}
                <h1>Rejected Event Requests</h1> {/* Changed Title */}
                <div className="search-bar"> {/* Reuse search bar class */}
                    <Search size={20} className="search-icon" />
                    <input
                        type="search"
                        placeholder="Search by Event ID (EID)..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                </div>
            </header>

            {/* Loading State (No changes needed) */}
            {isLoading && (
                <div className="loading-container">
                    <Loader className="spinner" size={40} /> Loading Rejected Events... {/* Changed text */}
                </div>
            )}

            {/* Error State (No changes needed) */}
            {error && !isLoading && (
                <div className="alert alert-error"><AlertTriangle /> {error}</div>
            )}

            {/* Events List / No Events Message */}
            {!isLoading && !error && (
                <div className="events-list">
                    {events.length === 0 ? (
                        <div className="no-events-message">
                            No rejected events found{searchTerm ? ` matching "${searchTerm}"` : ''}. {/* Changed text */}
                        </div>
                    ) : (
                        events.map(event => (
                            <div key={event._id} className="event-card rejected-card"> {/* Add specific class */}
                                <div className="event-card-header">
                                    <h3 className="event-name">{event.event_name}</h3>
                                    <span className="event-eid">EID: {event.eid}</span>
                                </div>
                                <div className="event-card-body">
                                    {/* Keep relevant details */}
                                    <div className="event-detail">
                                        <Calendar size={16} />
                                        <span>{formatDateTime(event.event_date)}</span>
                                    </div>
                                    <div className="event-detail">
                                        <Clock size={16} />
                                        <span>{event.time_slots?.join(', ') || 'N/A'}</span>
                                    </div>
                                    <div className="event-detail">
                                        <MapPin size={16} />
                                        <span>{event.room_number || 'N/A'}</span>
                                    </div>
                                    <div className="event-detail">
                                        <Users size={16} />
                                        <span>{event.club_name || 'N/A'}</span>
                                    </div>
                                    {/* Display Rejection Comments if available */}
                                    {event.comments && (
                                        <div className="event-detail event-comments">
                                            <MessageSquare size={16} />
                                            <p><strong>Reason:</strong> {event.comments}</p>
                                        </div>
                                    )}
                                    {/* Optionally display event description if needed */}
                                     {/* <div className="event-detail event-description">
                                         <FileText size={16} />
                                         <p>{event.event_details || 'No description.'}</p>
                                     </div> */}
                                </div>
                                <div className="event-card-actions">
                                    {/* REMOVED Budget Button */}
                                    <button
                                        onClick={() => handleDelete(event._id, event.event_name)}
                                        className="btn btn-danger btn-icon-text" // Keep delete button
                                        title="Delete Rejected Request"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// Update export
export default RejectedEventsPage;