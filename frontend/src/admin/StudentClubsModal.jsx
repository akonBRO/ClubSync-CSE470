// src/admin/StudentClubsModal.jsx
import React from 'react';
import styles from './StudentClubsModal.module.css'; // Create this file
import { FaSpinner, FaTimes, FaExclamationCircle, FaBookOpen } from 'react-icons/fa'; // Icons

const StudentClubsModal = ({ clubNames, loading, error, onClose }) => {
    console.log("StudentClubsModal Props:");
    console.log("  clubNames:", clubNames);
    console.log("  loading:", loading);
    console.log("  error:", error);


    // Prevent modal closing if loading or clicking inside modal content
    const handleOverlayClick = (e) => {
        if (loading) return; // Prevent closing while loading
        if (e.target.classList.contains(styles.modalOverlay)) {
            onClose();
        }
    };

    return (
        // Use the handleOverlayClick on the overlay div
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            {/* Prevent clicks inside modal content from bubbling to overlay */}
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Student Clubs</h2>
                    {!loading && ( // Only show close button when not loading
                         <button className={styles.closeButton} onClick={onClose}>
                             <FaTimes />
                         </button>
                    )}
                </div>

                <div className={styles.modalBody}>
                    {loading && (
                        <div className={styles.modalLoading}>
                             <FaSpinner className={styles.spinner} />
                             <p>Loading clubs...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className={styles.modalError}>
                            <FaExclamationCircle />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Ensure clubNames is an array before checking length */}
                    {!loading && !error && Array.isArray(clubNames) && clubNames.length === 0 && (
                        <div className={styles.modalEmpty}>
                             <FaBookOpen />
                             <p>This student is not currently in any clubs.</p>
                        </div>
                    )}

                    {/* Ensure clubNames is an array and not empty before mapping */}
                    {!loading && !error && Array.isArray(clubNames) && clubNames.length > 0 && (
    <ul className={styles.clubList}>
     {clubNames.map((name, index) => ( // 'name' here is the element from the array
<li key={index} className={styles.clubItem}>
    <FaBookOpen className={styles.clubItemIcon} />
    <span>{name || 'Unnamed Club'}</span> {/* If 'name' is undefined, shows 'Unnamed Club' */}
</li>
 ))}
     </ul>
                    )}
                </div>

                 {/* Moved the Close button to the footer */}
                <div className={styles.modalFooter}>
                    {!loading && ( // Only show footer button when not loading
                        <button className={styles.modalCloseBtn} onClick={onClose}>Close</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentClubsModal;