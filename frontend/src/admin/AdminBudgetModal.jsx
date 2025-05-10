import React, { useState, useEffect } from 'react';
import styles from './AdminBudgetModal.module.css';
import axios from 'axios';
import {
    FaTimes, FaSpinner, FaSave, FaExclamationTriangle, FaInfoCircle,
    FaFileInvoiceDollar, FaListOl, FaCommentDots, FaCalendarCheck, FaUniversity, FaTag
} from 'react-icons/fa'; // Added more icons

const AdminBudgetModal = ({ eventId, onClose }) => {
    const [eventDetails, setEventDetails] = useState(null); // To store event name, etc.
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false); // Separate state for submission loading
    const [error, setError] = useState('');
    const [budgetStatus, setBudgetStatus] = useState('pending');
    const [eventComments, setEventComments] = useState('');

    const budgetStatusOptions = ['pending', 'approved', 'rejected', 'hold'];

    useEffect(() => {
        fetchData();
    }, [eventId]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch the event to get its details (name, booking_id, existing comments)
            const eventRes = await axios.get(`http://localhost:3001/api/events/${eventId}`, {
                withCredentials: true
            });

            if (!eventRes.data.event) {
                setError('Could not find the event.');
                setLoading(false);
                return;
            }
            
            const currentEvent = eventRes.data.event;
            setEventDetails(currentEvent); // Store event details
            setEventComments(currentEvent.comments || ''); // Initialize comments

            if (!currentEvent.booking_id) {
                // This case means no budget can be fetched if booking_id is essential
                // but the admin might still want to add comments or manage a budget externally
                setBudget(null); // No budget to fetch
                setBudgetStatus('pending'); // Default status
                setLoading(false);
                // setError('Event has no associated booking ID to fetch budget.'); // Or just allow comment editing
                return; 
            }

            // Now fetch the budget using the booking_id
            const budgetRes = await axios.get(`http://localhost:3001/api/budgets/by-booking/${currentEvent.booking_id}`, {
                withCredentials: true
            });

            if (budgetRes.data.budget) {
                setBudget(budgetRes.data.budget);
                setBudgetStatus(budgetRes.data.budget.status || 'pending'); // Ensure default if status is null
            } else {
                setBudget(null); // No budget found for this booking_id
                setBudgetStatus('pending');
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            const errorMessage = err.response?.data?.message || 'Failed to fetch budget details.';
            if (err.response?.status === 404 && err.config.url.includes('/api/budgets/by-booking/')) {
                // It's a 404 for budget, not necessarily a critical error for the modal.
                // Event details might still be loaded.
                setBudget(null);
                setBudgetStatus('pending');
                // setError('No budget submitted, or budget not found.'); // Soft error
            } else {
                setError(errorMessage);
            }
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        setSubmitting(true);
        setError('');
        try {
            await axios.put(`http://localhost:3001/api/admins/events/${eventId}/budget`, {
                budgetStatus: budgetStatus,
                eventComments: eventComments
            }, {
                withCredentials: true
            });
            // alert('Budget and Event status/comments updated successfully!'); // Consider a less intrusive notification
            onClose(true); // Pass true to indicate successful submission for potential refresh
        } catch (err) {
            console.error('Error submitting budget review:', err);
            setError(err.response?.data?.message || 'Failed to submit budget review.');
            setSubmitting(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (submitting) return;
        if (e.target.classList.contains(styles.modalOverlay)) {
            onClose();
        }
    };

    const formatCurrency = (amount) => {
        return amount != null ? `৳${Number(amount).toFixed(2)}` : '৳0.00';
    };

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerTitle}>
                        <FaFileInvoiceDollar />
                        <h3>Budget Review: {eventDetails?.event_name || `Event ID ${eventId}`}</h3>
                    </div>
                    {!submitting && (
                        <button className={styles.closeButton} onClick={onClose} title="Close">
                            <FaTimes />
                        </button>
                    )}
                </div>

                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.centeredMessage}>
                            <FaSpinner className={styles.spinnerIcon} />
                            <p>Loading budget data...</p>
                        </div>
                    ) : error && !budget ? ( // Show critical error if budget couldn't be loaded and error is present
                        <div className={`${styles.centeredMessage} ${styles.errorMessage}`}>
                            <FaExclamationTriangle />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            {eventDetails && !budget && !error && ( // Only show if no budget and no critical error
                                 <div className={`${styles.centeredMessage} ${styles.infoMessage}`}>
                                    <FaInfoCircle />
                                    <p>No budget request has been submitted for this event yet.</p>
                                    <p>You can still add comments and set a budget status if applicable externally.</p>
                                </div>
                            )}

                            {budget && (
                                <section className={styles.budgetDetailsSection}>
                                    <h4><FaListOl /> Budget Items</h4>
                                    {budget.items && budget.items.length > 0 ? (
                                        <div className={styles.tableContainer}>
                                        <table className={styles.budgetItemsTable}>
                                            <thead>
                                                <tr>
                                                    <th>Category</th>
                                                    <th>Item</th>
                                                    <th>Qty</th>
                                                    <th>Unit Price</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {budget.items.map((item, index) => (
                                                    <tr key={item._id || index}>
                                                        <td><FaTag /> {item.category}</td>
                                                        <td>{item.item_name}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{formatCurrency(item.unit_price)}</td>
                                                        <td>{formatCurrency(item.total_price)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        </div>
                                    ) : (
                                        <p className={styles.noItemsMessage}>No items listed in the budget.</p>
                                    )}
                                    <div className={styles.totalBudget}>
                                        <strong>Total Proposed Budget: <span>{formatCurrency(budget.total_budget)}</span></strong>
                                    </div>
                                </section>
                            )}

                            <section className={styles.adminReviewSection}>
                                <h4><FaCommentDots /> Admin Review & Comments</h4>
                                {error && !submitting && ( // Show non-critical submission errors here
                                     <p className={`${styles.inlineErrorMessage} ${styles.errorMessage}`}>
                                        <FaExclamationTriangle /> {error}
                                    </p>
                                )}
                                <div className={styles.reviewForm}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="budgetStatus"><FaCalendarCheck /> Budget Status:</label>
                                        <select
                                            id="budgetStatus"
                                            value={budgetStatus}
                                            onChange={(e) => setBudgetStatus(e.target.value)}
                                            className={styles.formSelect}
                                            disabled={submitting}
                                        >
                                            {budgetStatusOptions.map(status => (
                                                <option key={status} value={status}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="eventComments"><FaUniversity /> Admin Comments (on Event):</label>
                                        <textarea
                                            id="eventComments"
                                            value={eventComments}
                                            onChange={(e) => setEventComments(e.target.value)}
                                            className={styles.formTextarea}
                                            rows="4"
                                            placeholder="Provide feedback or reasons for budget status..."
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                {!loading && ( // Only show footer if not initially loading
                    <div className={styles.modalFooter}>
                        <button
                            onClick={onClose}
                            className={`${styles.footerButton} ${styles.cancelButton}`}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmitReview}
                            className={`${styles.footerButton} ${styles.submitButton}`}
                            disabled={submitting || loading} // Also disable if main data is still loading
                        >
                            {submitting ? <FaSpinner className={styles.buttonSpinnerIcon} /> : <FaSave />}
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBudgetModal;