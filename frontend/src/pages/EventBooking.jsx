import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Calendar, Clock, MapPin, Users, FileText, CheckCircle, Info, Book, AlertTriangle, Loader // Added Loader and AlertTriangle
} from 'lucide-react'; // Using lucide-react as provided
import './EventBooking.css'; // We will update this file

const EventBooking = () => {
    const [formData, setFormData] = useState({
        club_name: '', // Fetch dynamically
        event_name: '',
        event_date: '',
        time_slots: [],
        room_number: '',
        std_reg: '',
        event_details: '',
    });
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false); // Loading state for submission
    const [formError, setFormError] = useState(''); // State for inline form errors
    const [formSuccess, setFormSuccess] = useState(''); // State for success message

    // Available time slots and room numbers (Keep as is)
    const [availableTimeSlots] = useState([
        '09:30 AM-10:50 AM', '11:00 AM-12:20 PM', '12:30 PM-01:50 PM',
        '02:00 PM - 03:20 PM', '03:30 PM - 04:50 PM', '05:00 PM - 06:20 PM'
    ]);
    const roomNumbers = [
        '12B-30L', '12B-31L', '12D-26L', '12D-27L', '12D-28L',
        'Club Room 1', 'Club Room 2', 'Club Room 3', 'Club Room 4',
        'Lecture Theatre 1', 'Lecture Theatre 2', 'Lecture Theatre 3',
        'Multi Purpose Hall', 'Auditorium'
    ];
    const [minDate, setMinDate] = useState('');

    // --- useEffect to fetch club name and set min date (Keep logic) ---
    useEffect(() => {
        setLoading(true);
        axios.get('http://localhost:3001/api/clubs/dashboard', { withCredentials: true })
            .then(response => {
                if (response.data.clubName) {
                    setFormData(prev => ({ ...prev, club_name: response.data.clubName }));
                } else {
                    setFormData(prev => ({ ...prev, club_name: 'Default Club' })); // Fallback
                }
            })
            .catch(error => {
                console.error('Error fetching club name:', error);
                setFormData(prev => ({ ...prev, club_name: 'Error Loading Club' })); // Show error
            })
            .finally(() => setLoading(false));

        const today = new Date();
        today.setDate(today.getDate() + 5);
        const minDateString = today.toISOString().split('T')[0];
        setMinDate(minDateString);
    }, []);

    // --- Handlers (Keep logic, minor class adjustments if needed) ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear messages on change
        setFormError('');
        setFormSuccess('');
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
         // Clear messages on change
         setFormError('');
         setFormSuccess('');
    };

    const handleTimeSlotChange = (slot) => {
        setFormData(prev => {
            let selectedSlots = prev.time_slots;
            if (selectedSlots.includes(slot)) {
                selectedSlots = selectedSlots.filter(s => s !== slot);
            } else if (selectedSlots.length < 2) {
                selectedSlots = [...selectedSlots, slot];
            }
             // Clear messages on change
             setFormError('');
             setFormSuccess('');
            return { ...prev, time_slots: selectedSlots };
        });
    };

    // --- Submit Handler (Keep logic, add loading and better feedback) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(''); // Clear previous errors
        setFormSuccess(''); // Clear previous success

        const { event_name, event_date, time_slots, room_number, std_reg, event_details } = formData;
        if (!event_name || !event_date || time_slots.length === 0 || !room_number || !std_reg || !event_details) {
            setFormError('All fields marked with * are required.');
            return;
        }
         if (event_date < minDate) {
             setFormError('Event date must be at least 5 days from today.');
             return;
         }
        if (time_slots.length > 2) { // Should be prevented by UI, but double-check
            setFormError('You can select a maximum of two time slots.');
            return;
        }

        const isConfirmed = window.confirm(
            "Please confirm your booking details:\n\n" +
            `Event: ${formData.event_name}\n` +
            `Date: ${formData.event_date}\n` +
            `Time Slots: ${formData.time_slots.join(', ') || 'None Selected'}\n` +
            `Room/Venue: ${formData.room_number}\n\n` +
            "Are you sure you want to submit this request?"
        );

        // --- Proceed only if user confirmed ---
        if (isConfirmed) {
            setSubmitLoading(true); // Start submit loading

        try {
            const response = await axios.post('http://localhost:3001/api/events/booking', formData);
            // Use state for success message instead of alert
            setFormSuccess(`Booking Successful! Your Booking ID: ${response.data.eid}.`);
            // Reset form after successful submission
            setFormData({
                club_name: formData.club_name, // Keep club name
                event_name: '', event_date: '', time_slots: [], room_number: '', std_reg: '', event_details: ''
            });
        } catch (error) {
            console.error('Error while submitting event:', error);
            // Use state for error message instead of alert
            if (error.response && error.response.data.message) {
                 setFormError(`Booking failed: ${error.response.data.message}`);
            } else {
                 setFormError('Booking failed. Please check the details or try again later.');
            }
        } finally {
             setSubmitLoading(false); // Stop submit loading
        }
    } else {
        // User clicked 'Cancel' on the confirmation dialog
        console.log("Booking submission cancelled by user.");
        // Optionally, provide feedback that the submission was cancelled
        // setFormError("Submission cancelled."); // Or use a different state for info messages
    }
};

    // --- Initial Loading State ---
    if (loading) {
        return (
            // Consistent loading style
            <div className="loading-container">
                <Loader className="spinner" size={40} /> Loading Booking Form...
            </div>
        );
    }

    // --- Main Render ---
    return (
        <div className="booking-container"> {/* Use consistent container class */}
            <h2 className="form-heading"> {/* Use consistent heading class */}
                <Book size={32} className="heading-icon" /> {/* Adjusted icon size */}
                Book an Event
            </h2>

            {/* Form-level Messages */}
            {formError && <div className="alert alert-error mb-4"><AlertTriangle /> {formError}</div>}
            {formSuccess && <div className="alert alert-success mb-4"><CheckCircle /> {formSuccess}</div>}

            <form onSubmit={handleSubmit} className="booking-form"> {/* Consistent form class */}

                {/* Club Name (Read Only) */}
                <div className="form-group">
                    <label htmlFor="club_name">
                        <Users size={18} className="label-icon" /> Club Name
                    </label>
                    <input
                        type="text"
                        id="club_name"
                        name="club_name"
                        value={formData.club_name}
                        readOnly
                        className="form-input readonly" // Specific class for readonly
                    />
                </div>

                {/* Event Name */}
                <div className="form-group">
                    <label htmlFor="event_name">
                        <FileText size={18} className="label-icon" /> Event Name <span className="required-star">*</span>
                    </label>
                    <input
                        type="text"
                        id="event_name"
                        name="event_name"
                        value={formData.event_name}
                        onChange={handleChange}
                        required
                        className="form-input"
                        placeholder="e.g., Annual Tech Fest"
                    />
                </div>

                {/* Event Date */}
                <div className="form-group">
                    <label htmlFor="event_date">
                        <Calendar size={18} className="label-icon" /> Event Date <span className="required-star">*</span>
                    </label>
                    <input
                        type="date"
                        id="event_date"
                        name="event_date"
                        value={formData.event_date}
                        onChange={handleDateChange}
                        required
                        min={minDate}
                        className="form-input"
                    />
                    {/* Inline validation message styling */}
                    {formData.event_date && formData.event_date < minDate && (
                        <p className="inline-error-message">
                            <Info size={14} /> Event date must be at least 5 days from today.
                        </p>
                    )}
                </div>

                {/* Time Slots */}
                <div className="form-group">
                    <label>
                        <Clock size={18} className="label-icon" /> Time Slot(s) (Max 2) <span className="required-star">*</span>
                    </label>
                    <div className="time-slots-container">
                        {availableTimeSlots.map(slot => (
                            <button
                                key={slot}
                                type="button"
                                // Apply dynamic classes based on state
                                className={`time-slot-button ${formData.time_slots.includes(slot) ? 'selected' : ''} ${formData.time_slots.length >= 2 && !formData.time_slots.includes(slot) ? 'disabled' : ''}`}
                                onClick={() => handleTimeSlotChange(slot)}
                                // Disable button if max slots reached and this one isn't selected
                                disabled={formData.time_slots.length >= 2 && !formData.time_slots.includes(slot)}
                            >
                                {slot}
                                {formData.time_slots.includes(slot) && <CheckCircle size={16} className="slot-icon" />}
                            </button>
                        ))}
                    </div>
                    {/* Helper text for selected slots */}
                    {formData.time_slots.length > 0 && (
                        <p className="helper-text mt-2">
                            Selected: {formData.time_slots.join(', ')}
                        </p>
                    )}
                     {/* Helper text for max slots */}
                    {formData.time_slots.length >= 2 && (
                        <p className="helper-text-warning mt-1">
                            <Info size={14} /> Maximum two time slots reached.
                        </p>
                    )}
                </div>

                {/* Room Number */}
                <div className="form-group">
                    <label htmlFor="room_number">
                        <MapPin size={18} className="label-icon" /> Room/Venue <span className="required-star">*</span>
                    </label>
                    <select
                        id="room_number"
                        name="room_number"
                        value={formData.room_number}
                        onChange={handleChange}
                        required
                        className="form-select" // Use consistent select class
                    >
                        <option value="" disabled>-- Select a Room or Venue --</option>
                        {roomNumbers.map(room => (
                            <option key={room} value={room}>{room}</option>
                        ))}
                    </select>
                </div>

                {/* Student Registration */}
                <div className="form-group">
                    <label htmlFor="std_reg">
                        <Users size={18} className="label-icon" /> Student Registration Required? <span className="required-star">*</span>
                    </label>
                    <select
                        id="std_reg"
                        name="std_reg"
                        value={formData.std_reg}
                        onChange={handleChange}
                        required
                        className="form-select"
                    >
                        <option value="" disabled>-- Select Yes or No --</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>

                {/* Event Description */}
                <div className="form-group">
                    <label htmlFor="event_details">
                        <FileText size={18} className="label-icon" /> Event Description <span className="required-star">*</span>
                    </label>
                    <textarea
                        id="event_details"
                        name="event_details"
                        rows="5"
                        value={formData.event_details}
                        onChange={handleChange}
                        required
                        className="form-input" // Use consistent input class
                        placeholder="Briefly describe the event, purpose, expected audience, etc."
                    ></textarea>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn btn-primary submit-btn" // Use consistent button classes
                    disabled={submitLoading} // Disable while submitting
                >
                    {submitLoading ? (
                        <><Loader size={20} className="spinner mr-2" /> Submitting...</>
                    ) : (
                        <><CheckCircle size={20} /> Submit Booking Request</>
                    )}
                </button>
            </form>
        </div>
    );
};

export default EventBooking;