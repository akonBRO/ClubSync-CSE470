import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar,MessageSquare, Clock, MapPin, Users, FileText, Trash2, Eye, Search, ListFilter, Loader, AlertTriangle, User, Mail, X } from 'lucide-react';
import { debounce } from 'lodash';
import './ApprovedEvents.css';

const ApprovedEventsPage = () => {
const [events, setEvents] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
const [searchTerm, setSearchTerm] = useState('');
const navigate = useNavigate();

// --- State for Registered Students Modal ---
const [showRegisteredStudentsModal, setShowRegisteredStudentsModal] = useState(false);
const [registeredStudentsList, setRegisteredStudentsList] = useState([]);
const [loadingRegisteredStudents, setLoadingRegisteredStudents] = useState(false);
const [registeredStudentsError, setRegisteredStudentsError] = useState(null);
const [currentEventId, setCurrentEventId] = useState(null);
// --- Added State for Modal Search ---
const [modalSearchTerm, setModalSearchTerm] = useState('');
// --- End Added State for Modal Search ---
// --- End State for Registered Students Modal ---


// --- Fetch Approved Events Function ---
const fetchApprovedEvents = useCallback(async (currentSearchTerm) => {
    setIsLoading(true);
    setError('');
    try {
        const response = await axios.get(`http://localhost:3001/api/events/status/Approved`, {
            params: { search: currentSearchTerm },
                withCredentials: true
        });
        setEvents(response.data);
    } catch (err) {
        console.error("Error fetching approved events:", err);
        if (err.response?.status === 401) {
                setError("Authentication failed. Please log in as a club representative.");
        } else {
                setError(err.response?.data?.message || "Failed to load approved events. Please try again.");
        }
        setEvents([]);
    } finally {
        setIsLoading(false);
    }
}, []);

// --- Debounced Fetch Function ---
// eslint-disable-next-line react-hooks/exhaustive-deps
const debouncedFetch = useCallback(
    debounce((term) => {
        fetchApprovedEvents(term);
    }, 500),
    [fetchApprovedEvents]
);

// --- Initial Fetch and Fetch on Search Term Change ---
useEffect(() => {
    debouncedFetch(searchTerm);
    return () => {
        debouncedFetch.cancel();
    };
}, [searchTerm, debouncedFetch]);

// --- Handle Search Input Change ---
const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
};

// --- Handle Delete ---
const handleDelete = async (eventId, eventName) => {
    if (window.confirm(`Are you sure you want to delete the event "${eventName}" (ID: ${eventId})? This action cannot be undone.`)) {
        try {
            await axios.delete(`http://localhost:3001/api/events/${eventId}`, { withCredentials: true });
            setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
            alert(`Event "${eventName}" deleted successfully.`);
        } catch (err) {
            console.error("Error deleting event:", err);
                if (err.response?.status === 401) {
                    setError("Authentication failed. You are not authorized to delete events.");
                } else {
                    setError(err.response?.data?.message || "Failed to delete event.");
                }
        }
    }
};

// --- Handle View Budget Navigation ---
const handleViewBudget = (bookingId) => {
    navigate(`/club/events/budget/${bookingId}`);
};

// --- Handle View Registered Students ---
const handleViewRegisteredStudents = async (eventId, registeredStudentUids) => {
    setCurrentEventId(eventId);
    setShowRegisteredStudentsModal(true);
    setLoadingRegisteredStudents(true);
    setRegisteredStudentsError(null);
    setRegisteredStudentsList([]);
    setModalSearchTerm(''); // Clear modal search term when opening

    if (!registeredStudentUids || registeredStudentUids.length === 0) {
        setLoadingRegisteredStudents(false);
        return;
    }

    try {
        const response = await axios.post(`http://localhost:3001/api/events/${eventId}/registered-students`,
            { studentUids: registeredStudentUids },
            { withCredentials: true }
        );
        setRegisteredStudentsList(response.data);
        console.log("Fetched registered students:", response.data);
    } catch (err) {
        console.error("Error fetching registered students:", err);
        let errorMessage = 'Failed to fetch registered students.';
            if (err.response?.status === 401) {
                errorMessage = "Authentication failed. Please log in as a club representative.";
            } else {
                errorMessage = err.response?.data?.message || errorMessage;
            }
        setRegisteredStudentsError(errorMessage);
    } finally {
        setLoadingRegisteredStudents(false);
    }
};

// --- Helper function to format date and time ---
const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

// --- Filtered list for the modal ---
const filteredRegisteredStudents = registeredStudentsList.filter(student =>
    student.uid.toString().includes(modalSearchTerm.toLowerCase()) // Filter by student UID (convert to string for includes)
);


return (
    <div className="approved-events-container">
        <header className="approved-events-header">
            <h1>Approved Events</h1>
            <div className="search-bar">
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

        {/* Loading State */}
        {isLoading && (
            <div className="loading-container">
                <Loader className="spinner" size={40} /> Loading Events...
            </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
            <div className="alert alert-error"><AlertTriangle /> {error}</div>
        )}

        {/* Events List / No Events Message */}
        {!isLoading && !error && (
            <div className="events-list">
                {events.length === 0 ? (
                    <div className="no-events-message">
                        No approved events found{searchTerm ? ` matching "${searchTerm}"` : ''}.
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event._id} className="event-card">
                            <div className="event-card-header">
                                <h3 className="event-name">{event.event_name}</h3>
                                <span className="event-eid">EID: {event.eid}</span>
                            </div>
                            <div className="event-card-body">
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
                                    <div className="event-detail event-description">
                                        <FileText size={16} />
                                        <p>{event.event_details || 'No description available.'}</p>
                                    </div>
                                    <div className="event-detail event-description">
                                        <MessageSquare size={16} />
                                        <p>{event.comments || 'No Comments available.'}</p>
                                    </div>
                            </div>
                            <div className="event-card-actions">
                                
                                {/* View Registered Students Button */}
                                {event.std_reg === 'Yes' && event.reg_std && event.reg_std.length > 0 && (
                                    <button
                                        onClick={() => handleViewRegisteredStudents(event._id, event.reg_std)}
                                        className="btn btn-primary btn-icon-text"
                                        title={`View ${event.reg_std.length} Registered Student(s)`}
                                        disabled={loadingRegisteredStudents}
                                    >
                                            <Users size={16} /> Registered ({event.reg_std.length})
                                    </button>
                                )}
                                    {/* Show count even if button isn't shown, or a message if no registrations */}
                                    {event.std_reg === 'Yes' && (!event.reg_std || event.reg_std.length === 0) && (
                                        <span className="registration-count">No registrations yet</span>
                                    )}
                                    {event.std_reg !== 'Yes' && (
                                        <span className="registration-count">Registration not open</span>
                                    )}
                                    <button
                                    onClick={() => handleViewBudget(event.booking_id)}
                                    className="btn btn-secondary btn-icon-text"
                                    title="View Budget Details"
                                >
                                    <Eye size={16} /> Budget
                                </button>
                                <button
                                    onClick={() => handleDelete(event._id, event.event_name)}
                                    // Add a specific class for icon-only styling
                                    className="btn btn-danger btn-icon-only"
                                    title="Delete Event" // Keep title for accessibility
                                >
                                    <Trash2 size={16} />
                                    {/* Text is removed via CSS */}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* --- Registered Students Modal --- */}
        {showRegisteredStudentsModal && (
            <div className="modal-overlay" onClick={() => setShowRegisteredStudentsModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    
                    <h3>Registered Students{currentEventId ? ` for Event ID: ${events.find(e => e._id === currentEventId)?.eid || 'N/A'}` : ''}</h3>
                    <button className="modal-close-button" onClick={() => setShowRegisteredStudentsModal(false)}>
                        <X size={24} />
                    </button></div>
                    {/* --- Added Modal Search Bar --- */}
                    <div className="modal-body">
                    <div className="modal-search-bar">
                            <Search size={18} className="modal-search-icon" />
                            <input
                                type="text"
                                placeholder="Search by Student ID..."
                                value={modalSearchTerm}
                                onChange={(e) => setModalSearchTerm(e.target.value)}
                                className="modal-search-input"
                            />
                    </div></div>
                    {/* --- End Added Modal Search Bar --- */}


                    {loadingRegisteredStudents && (
                        <div className="loading-container">
                            <Loader className="spinner" size={30} /> Loading Students...
                        </div>
                    )}

                    {registeredStudentsError && (
                        <div className="alert alert-error"><AlertTriangle /> {registeredStudentsError}</div>
                    )}

                    {!loadingRegisteredStudents && !registeredStudentsError && filteredRegisteredStudents.length === 0 && (
                        <div className="no-data-message">
                            {modalSearchTerm ? `No students found matching ID "${modalSearchTerm}".` : 'No students registered for this event yet.'}
                        </div>
                    )}

                    {!loadingRegisteredStudents && !registeredStudentsError && filteredRegisteredStudents.length > 0 && (
                        // Inside the {!loadingRegisteredStudents && ... && filteredRegisteredStudents.length > 0 && (...)} block:

                        <ul className="registered-students-list">
                        {filteredRegisteredStudents.map((student, index) => (
                            <li
                            key={student.uid || index}
                            className="registered-student-item"
                            // Optional: Add delay for staggered animation (requires JS to set --index)
                            // style={{ '--index': index }}
                            >
                            {/* Name Row (Distinct Styling) */}
                            <div className="student-name-row">
                                <User size={18} className="student-icon" /> {/* User Icon */}
                                <span className="student-name-text">{student.uname || 'N/A'}</span>
                            </div>

                            {/* Details Section */}
                            <div className="student-details-section">
                                <div className="student-detail-row">
                                <FileText size={14} className="detail-icon" /> {/* ID Icon */}
                                <span className="detail-label">ID:</span>
                                <span className="detail-value">{student.uid || 'N/A'}</span>
                                </div>
                                <div className="student-detail-row">
                                <Mail size={14} className="detail-icon" /> {/* Email Icon */}
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{student.umail || 'N/A'}</span>
                                </div>
                            </div>
                            </li>
                        ))}
                        </ul>
                    )}
                </div>
            </div>
        )}
        {/* --- End Registered Students Modal --- */}

    </div>
);
};

export default ApprovedEventsPage;
