// frontend/src/students/UpcomingEvents.js
import React, { useState, useEffect, useContext /* or useSelector if using Redux */ } from 'react';
import axios from 'axios';
import styles from './UpcomingEvents.module.css';
// Added FaSpinner, FaCheckCircle, FaTimesCircle, FaEyeSlash (optional for button state)
import {
FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUniversity, FaInfoCircle, FaSearch,
FaFilter, FaUserCheck, FaExclamationCircle, FaEye, FaTimes, FaSpinner, FaCheckCircle, FaTimesCircle, FaEyeSlash
} from 'react-icons/fa';
import { BeatLoader } from 'react-spinners'; // Keep BeatLoader or replace spinner logic

function UpcomingEvents() {
const [events, setEvents] = useState([]);
const [filteredEvents, setFilteredEvents] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [selectedClub, setSelectedClub] = useState('');
const [allClubs, setAllClubs] = useState([]);
const [registrationStatus, setRegistrationStatus] = useState({});

// --- State for Registered Events Modal ---
const [showRegisteredEvents, setShowRegisteredEvents] = useState(false);
const [registeredEvents, setRegisteredEvents] = useState([]);
const [loadingRegistered, setLoadingRegistered] = useState(false);
const [registeredError, setRegisteredError] = useState(null);
// --- End State for Registered Events Modal ---


// --- Get Logged-in Student Info ---
const getStudentIdentifierFromStorage = () => {
    try {
        const storedId = localStorage.getItem('studentId'); // Looking for 'studentId'

        if (storedId) {
            const idAsNumber = parseInt(storedId, 10);
            if (!isNaN(idAsNumber)) {
                console.log("Parsed numeric student ID from storage:", idAsNumber);
                return idAsNumber;
            } else {
                console.warn("Stored student ID is not a number, returning null. Value:", storedId); // Changed log level
                return null;
            }
        } else {
                console.warn("No 'studentId' found in localStorage."); // Changed log level
                return null;
        }
    } catch (e) {
        console.error("Error reading student info from localStorage", e);
    }
    return null;
};

const loggedInStudentIdentifier = getStudentIdentifierFromStorage();

// --- Check Authentication on Mount (Optional but Recommended) ---
useEffect(() => {
    if (!loggedInStudentIdentifier) {
        console.warn("UpcomingEvents: No logged-in student identifier found from storage. Registration might fail.");
        // Optionally set an error or redirect here if login is strictly required to view
    } else {
        console.log("UpcomingEvents: Logged-in student identifier found from storage:", loggedInStudentIdentifier);
    }
}, [loggedInStudentIdentifier]); // Dependency array is correct

// --- Fetch Approved Events ---
useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get('http://localhost:3001/api/student/events/upcoming', { withCredentials: true })
        .then(response => {
            // Ensure event_date is valid before sorting
            const sortedEvents = response.data
                .filter(event => !isNaN(new Date(event.event_date).getTime())) // Filter out invalid dates
                .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

            setEvents(sortedEvents);
            setFilteredEvents(sortedEvents);
            const clubs = [...new Set(sortedEvents.map(event => event.club_name))].filter(Boolean); // Filter out null/empty club names
            setAllClubs(clubs.sort());
        })
        .catch(err => {
            console.error("Error fetching upcoming events:", err);
            if (err.response) {
                console.error("Error data:", err.response.data);
                console.error("Error status:", err.response.status);
                if (err.response.status === 401) {
                    setError("Authentication required. Please log in to view events.");
                    console.log("Received 401, potentially session expired or invalid cookie.");
                    // Consider redirecting to login page here
                } else {
                    setError(err.response.data.message || `Error fetching data (Status: ${err.response.status})`);
                }
            } else if (err.request) {
                console.error("Error request:", err.request);
                setError("Network Error: Could not connect to the server. Please check your connection and if the server is running.");
            } else {
                console.error('Error message:', err.message);
                setError(`An unexpected error occurred: ${err.message}`);
            }
        })
        .finally(() => {
            setLoading(false);
        });
}, []); // Empty dependency array means run once on mount

// --- Filter Events based on Search and Club Selection ---
useEffect(() => {
    let currentEvents = [...events];
    const searchTermLower = searchTerm.trim().toLowerCase();
    const clubFilterActive = !!selectedClub; // Check if a club is actually selected

    if (searchTermLower) {
        currentEvents = currentEvents.filter(event =>
            (event.eid && event.eid.toLowerCase().includes(searchTermLower)) || // Check EID
            (event.event_name && event.event_name.toLowerCase().includes(searchTermLower)) // Also check Event Name
            // Add more fields to search if needed (e.g., event.event_details)
        );
    }

    if (clubFilterActive) {
        currentEvents = currentEvents.filter(event =>
            event.club_name === selectedClub
        );
    }

    setFilteredEvents(currentEvents);
}, [searchTerm, selectedClub, events]); // Re-run when search, filter, or base events change


// --- Handle Event Registration ---
const handleRegister = (eventId, eventName) => {
    if (!loggedInStudentIdentifier) {
        setError("Please log in to register for events."); // Show error centrally or use alert
        // alert('Could not identify student. Please ensure you are logged in.');
        return;
    }

    const confirmation = window.confirm(`Confirm registration for "${eventName}"? You can't delete this once you're registered.`);
    if (confirmation) {
        // Indicate loading specifically for this event
        setRegistrationStatus(prev => ({ ...prev, [eventId]: { loading: true, message: null, error: false, success: false } }));

        axios.post(`http://localhost:3001/api/student/events/register/${eventId}`,
            {}, // Empty body, data sent via session/cookie
            { withCredentials: true }
        )
        .then(response => {
            console.log('Registration successful/status:', response.data);
            const message = response.data.message || 'Registration successful!';
            const isAlreadyRegistered = response.data.alreadyRegistered || false;

            // Update status: success
            setRegistrationStatus(prev => ({ ...prev, [eventId]: { loading: false, success: true, message: message } }));

            // Update the main event list's registration status visually *immediately*
            // Only add student ID if they weren't already marked as registered by the backend response
            if (!isAlreadyRegistered) {
                setEvents(prevEvents => prevEvents.map(event => {
                    if (event._id === eventId) {
                            // Ensure reg_std is an array, initialize if not
                            const currentRegStd = Array.isArray(event.reg_std) ? event.reg_std : [];
                        // Add student if not already present (double check)
                        const updatedRegStd = currentRegStd.includes(loggedInStudentIdentifier)
                            ? currentRegStd
                            : [...currentRegStd, loggedInStudentIdentifier];
                        return { ...event, reg_std: updatedRegStd };
                    }
                    return event;
                }));
            } else {
                    // If already registered, ensure the frontend state reflects this too
                    setEvents(prevEvents => prevEvents.map(event => {
                    if (event._id === eventId) {
                            const currentRegStd = Array.isArray(event.reg_std) ? event.reg_std : [];
                            // Ensure the student ID is in the array if the backend says they are registered
                        const updatedRegStd = currentRegStd.includes(loggedInStudentIdentifier)
                            ? currentRegStd
                            : [...currentRegStd, loggedInStudentIdentifier];
                            return { ...event, reg_std: updatedRegStd };
                    }
                    return event;
                }));
            }

            // If the registered events modal is open, refresh its data
            if (showRegisteredEvents) {
                fetchRegisteredEvents(); // Re-fetch to show the newly registered event
            }

            // Clear the success message after a delay
            setTimeout(() => {
                setRegistrationStatus(prev => ({ ...prev, [eventId]: undefined }));
            }, 5000); // 5 seconds
        })
        .catch(err => {
            console.error("Error registering for event:", eventId, err);
            let errorMessage = 'Registration failed. Please try again.';
            if (err.response) {
                console.error("Registration Error data:", err.response.data);
                console.error("Registration Error status:", err.response.status);
                    if (err.response.status === 401) {
                    errorMessage = "Authentication failed. Please log in again.";
                    setError("Authentication failed during registration. Please log in again."); // Show global error too
                } else if (err.response.status === 400) { // Example: Bad Request (e.g., event full, not open)
                        errorMessage = err.response.data.message || "Cannot register for this event (e.g., event full or closed).";
                } else if (err.response.status === 404) { // Example: Not Found
                        errorMessage = "Event not found.";
                } else if (err.response.status === 409) { // Example: Conflict (already registered)
                    errorMessage = err.response.data.message || "You are already registered for this event.";
                    // Ensure frontend state reflects "registered" if backend confirms it
                    setEvents(prevEvents => prevEvents.map(event => {
                        if (event._id === eventId) {
                            const currentRegStd = Array.isArray(event.reg_std) ? event.reg_std : [];
                            const updatedRegStd = currentRegStd.includes(loggedInStudentIdentifier)
                                ? currentRegStd
                                : [...currentRegStd, loggedInStudentIdentifier];
                            return { ...event, reg_std: updatedRegStd };
                        }
                        return event;
                    }));
                }
                    else {
                    errorMessage = err.response.data.message || `Registration error (Status: ${err.response.status}).`;
                }
            } else if (err.request) {
                errorMessage = "Network error during registration. Please check connection.";
            } else {
                errorMessage = `An unexpected error occurred: ${err.message}`;
            }

            // Update status: error
            setRegistrationStatus(prev => ({ ...prev, [eventId]: { loading: false, error: true, message: errorMessage } }));

            // Clear the error message after a longer delay
                setTimeout(() => {
                    setRegistrationStatus(prev => ({...prev, [eventId]: undefined}));
                }, 7000); // 7 seconds
        });
    } else {
        console.log("Registration cancelled by user.");
    }
};

// --- Fetch Registered Events ---
const fetchRegisteredEvents = async () => {
    if (!loggedInStudentIdentifier) {
        setRegisteredError("Authentication required to view registered events.");
            setRegisteredEvents([]); // Clear previous data if logged out
        return;
    }

    setLoadingRegistered(true);
    setRegisteredError(null);

    try {
        const response = await axios.get('http://localhost:3001/api/student/events/registered', { withCredentials: true });
        // Sort registered events by date as well
        const sortedRegistered = response.data
            .filter(event => !isNaN(new Date(event.event_date).getTime()))
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
        setRegisteredEvents(sortedRegistered);
        console.log("Fetched and sorted registered events:", sortedRegistered);
    } catch (err) {
        console.error("Error fetching registered events:", err);
        let errorMessage = 'Failed to fetch registered events.';
            if (err.response) {
                console.error("Fetch Registered Error Status:", err.response.status);
                if (err.response.status === 401) {
                errorMessage = "Authentication failed. Please log in again.";
                    // Optionally clear local storage / redirect
            } else {
                errorMessage = err.response.data.message || `Error (Status: ${err.response.status})`;
            }
        } else if (err.request) {
            errorMessage = "Network Error: Could not connect to server.";
        } else {
            errorMessage = `An unexpected error occurred: ${err.message}`;
        }
        setRegisteredError(errorMessage);
        setRegisteredEvents([]); // Clear data on error
    } finally {
        setLoadingRegistered(false);
    }
};

// --- Handle View Registered Button Click ---
const handleViewRegisteredClick = () => {
    // Always fetch the latest when the button is clicked to open the modal
    if (!showRegisteredEvents) {
        fetchRegisteredEvents();
    }
    setShowRegisteredEvents(true); // Show the modal
};

const closeModal = () => {
    setShowRegisteredEvents(false);
    setRegisteredError(null); // Clear modal-specific errors when closing
        // Don't clear registeredEvents data immediately, it might be useful if reopened quickly
};


// --- Helper formatDateTime ---
const formatDateTime = (dateString, timeSlots) => {
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return "Invalid Date";
        }
        const formattedDate = date.toLocaleDateString('en-GB', { // Use en-GB for DD/MM/YYYY or en-US for MM/DD/YYYY
            year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
        });
        const formattedTime = Array.isArray(timeSlots) && timeSlots.length > 0
                                ? timeSlots.join(' / ')
                                : 'Time TBC'; // TBC = To Be Confirmed
        return `${formattedDate} ・ ${formattedTime}`; // Use a separator like '・'
    } catch (e) {
            console.error("Error formatting date/time:", dateString, timeSlots, e);
            return "Date/Time Error";
    }
};

// --- JSX Rendering ---
return (
    <div className={styles.upcomingEventsContainer}>
        <h1 className={styles.pageTitle}>
                <FaCalendarAlt /> Upcoming Events
        </h1>

        {/* --- Global Error Display Area --- */}
            {error && !loading && (
                <div className={styles.globalError}>
                    <FaExclamationCircle /> {error}
                    {/* Optionally add a dismiss button */}
                </div>
            )}


        {/* --- Controls Section --- */}
        <div className={styles.controls}>
            {/* Search Input */}
            <div className={styles.controlGroup}>
                    <label htmlFor="eventSearch" className={styles.controlLabel}><FaSearch /> Search</label>
                <div className={styles.inputIconWrapper}>
                    <FaSearch className={styles.inputIcon} />
                    <input
                        id="eventSearch"
                        type="text"
                        placeholder="Search by Event ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.inputField}
                    />
                </div>
            </div>

                {/* Filter Dropdown */}
                <div className={styles.controlGroup}>
                    <label htmlFor="clubFilter" className={styles.controlLabel}><FaFilter /> Filter by Club</label>
                <div className={styles.inputIconWrapper}>
                        <FaUniversity className={styles.inputIcon} /> {/* Changed icon */}
                    <select
                        id="clubFilter"
                        value={selectedClub}
                        onChange={(e) => setSelectedClub(e.target.value)}
                        className={styles.selectField} // Use a different class if needed
                    >
                        <option value="">All Clubs</option>
                        {allClubs.map(club => (
                            <option key={club} value={club}>{club}</option>
                        ))}
                    </select>
                </div>
                </div>

            {/* View Registered Events Button */}
            {loggedInStudentIdentifier && ( // Only show if logged in
                <div className={`${styles.controlGroup} ${styles.viewRegisteredButtonGroup}`}>
                        {/* No label needed if button text is clear */}
                    <button
                        className={styles.viewRegisteredButton}
                        onClick={handleViewRegisteredClick}
                        disabled={loadingRegistered} // Disable while modal data is loading
                    >
                        {loadingRegistered
                            ? <><FaSpinner className={styles.spinner} /> Loading...</>
                            : <><FaEye /> My Registrations</>
                            }
                    </button>
                </div>
            )}
                {!loggedInStudentIdentifier && (
                    <div className={styles.loginPrompt}> {/* Optional: Prompt to log in */}
                        <FaInfoCircle/> Log in to register for events and view your registrations.
                    </div>
                )}
        </div>
        {/* --- End Controls Section --- */}


        {/* --- Main Content Area --- */}
        <div className={styles.contentArea}>
            {/* Loading State */}
                {loading && (
                <div className={styles.centeredMessage}>
                    <BeatLoader color="var(--primary-color, #007bff)" loading={loading} size={18} />
                    <p>Loading Events...</p>
                </div>
                )}

            {/* No Events Found State (After Load, No Error) */}
            {!loading && !error && filteredEvents.length === 0 && (
                <div className={styles.centeredMessage}>
                    <h2>{events.length === 0 ? "No Upcoming Events" : "No Events Match"}</h2>
                    <p>{events.length === 0 ? "Check back later for new events." : "Try adjusting your search or filter."}</p>
                        {/* Optional: Add an image or icon here */}
                </div>
            )}


            {/* Events Grid */}
            {!loading && !error && filteredEvents.length > 0 && (
                <div className={styles.eventsGrid}>
                    {filteredEvents.map(event => {
                        // Ensure event._id exists before proceeding
                        if (!event || !event._id) {
                            console.warn("Skipping rendering event due to missing _id:", event);
                            return null; // Skip rendering this invalid event data
                        }

                        // Check registration status robustly
                        const isRegistered = loggedInStudentIdentifier &&
                                                Array.isArray(event.reg_std) &&
                                                event.reg_std.includes(loggedInStudentIdentifier);

                            const regInfo = registrationStatus[event._id]; // Contains loading, success, error, message
                            const canRegister = event.std_reg === 'Yes'; // Check if registration is open for the event

                        return (
                            <div key={event._id} className={`${styles.eventCard} ${isRegistered ? styles.eventCardRegistered : ''}`}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.eventName}>{event.event_name || 'Unnamed Event'}</h3>
                                        <span className={styles.eventEid}><FaInfoCircle /> {event.eid || 'No ID'}</span>
                                </div>

                                <div className={styles.cardBody}>
                                    <p className={styles.eventMeta}>
                                            <FaUniversity />
                                            <span><strong>Club:</strong> {event.club_name || 'N/A'}</span>
                                        </p>
                                    <p className={styles.eventMeta}>
                                        <FaCalendarAlt />
                                        <span>{formatDateTime(event.event_date, event.time_slots)}</span>
                                    </p>
                                    <p className={styles.eventMeta}>
                                        <FaMapMarkerAlt />
                                        <span><strong>Location:</strong> {event.room_number ? ` ${event.room_number}` : 'Location TBD'}</span>
                                    </p>
                                    {event.event_details && (
                                        <p className={styles.eventDetails}>
                                                {/* Using dangerouslySetInnerHTML is risky if details contain HTML from users.
                                                    Sanitize backend or use a library like DOMPurify on frontend if needed.
                                                    Assuming details are plain text for now. */}
                                                {event.event_details.substring(0, 120)}{event.event_details.length > 120 ? '...' : ''}
                                                {/* Add a "Read More" button if needed */}
                                        </p>
                                    )}
                                </div>

                                {/* Registration Footer Area */}
                                <div className={styles.cardFooter}>
                                    {canRegister && loggedInStudentIdentifier && ( // Show button only if reg is 'Yes' and user is logged in
                                        <div className={styles.registrationArea}>
                                            <button
                                                className={`${styles.registerButton} ${isRegistered ? styles.registered : styles.notRegistered} ${regInfo?.loading ? styles.loading : ''} ${regInfo?.success ? styles.successFlash : ''} ${regInfo?.error ? styles.errorFlash : ''}`}
                                                onClick={() => !isRegistered && !regInfo?.loading && handleRegister(event._id, event.event_name)}
                                                disabled={isRegistered || regInfo?.loading} // Disable if registered OR currently loading
                                                title={isRegistered ? "You are registered for this event" : `Register for ${event.event_name}`}
                                            >
                                                {regInfo?.loading ? (
                                                    <><FaSpinner className={styles.spinner} /> Processing...</>
                                                ) : isRegistered ? (
                                                    <><FaUserCheck /> Registered</>
                                                ) : (
                                                    'Register Now'
                                                )}
                                            </button>
                                                {/* Status Message Area - show only ONE message at a time */}
                                                <div className={styles.regStatusMessage}>
                                                    {regInfo?.success && !regInfo?.loading && <span className={styles.regSuccess}><FaCheckCircle /> {regInfo.message}</span>}
                                                    {regInfo?.error && !regInfo?.loading && <span className={styles.regError}><FaTimesCircle /> {regInfo.message}</span>}
                                                    {/* Optional: Add message if registration is closed */}
                                                    {/* {!isRegistered && !regInfo && event.status === 'Closed' && <span className={styles.regInfo}>Registration Closed</span>} */}
                                                </div>
                                        </div>
                                    )}
                                        {canRegister && !loggedInStudentIdentifier && ( // Show prompt if reg is 'Yes' but user not logged in
                                            <div className={styles.loginToRegisterPrompt}>
                                                <FaInfoCircle /> Log in to register
                                            </div>
                                        )}
                                    {!canRegister && ( // Show message if registration is not available ('No' or other value)
                                        <div className={styles.noRegistration}>
                                            <FaEyeSlash /> Registration not required or unavailable
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div> {/* End Content Area */}


        {/* --- Registered Events Modal --- */}
        {showRegisteredEvents && (
                // Use the closeModal function on overlay click
            <div className={styles.modalOverlay} onClick={closeModal}>
                    {/* Stop propagation so clicking inside modal doesn't close it */}
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.modalCloseButton} onClick={closeModal} aria-label="Close modal">
                        <FaTimes />
                    </button>
                    <h2 className={styles.modalTitle}><FaUserCheck /> Your Registered Events</h2>

                        {loadingRegistered && (
                        <div className={styles.centeredMessage}>
                            <BeatLoader color="var(--primary-color, #007bff)" size={15} />
                            <p>Loading your registrations...</p>
                        </div>
                        )}

                        {registeredError && !loadingRegistered && (
                        <div className={`${styles.centeredMessage} ${styles.modalError}`}>
                            <FaExclamationCircle size={24} />
                            <p>{registeredError}</p>
                            {/* Optionally add a retry button */}
                            {/* <button onClick={fetchRegisteredEvents}>Retry</button> */}
                        </div>
                        )}

                        {!loadingRegistered && !registeredError && registeredEvents.length === 0 && (
                            <div className={styles.centeredMessage}>
                            <FaCalendarAlt size={30} style={{marginBottom: '10px', color: '#aaa'}}/>
                            <p>You haven't registered for any upcoming events yet.</p>
                            </div>
                        )}

                    {!loadingRegistered && !registeredError && registeredEvents.length > 0 && (
                        <ul className={styles.registeredEventsList}>
                            {registeredEvents.map(event => (
                                <li key={event._id} className={styles.registeredEventItem}>
                                    <strong className={styles.registeredEventName}>{event.event_name}</strong>
                                    <p><FaUniversity /> {event.club_name || 'N/A'}</p>
                                    <p><FaCalendarAlt /> {formatDateTime(event.event_date, event.time_slots)}</p>
                                        <p><FaMapMarkerAlt /> {event.room_number ? `Room ${event.room_number}` : 'Location TBD'}</p>
                                        <span className={styles.registeredEventEid}><FaInfoCircle /> EID: {event.eid || 'N/A'}</span>
                                        {/* Add a link/button to view event details maybe? */}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        )}
        {/* --- End Registered Events Modal --- */}

    </div>
);
}

export default UpcomingEvents;