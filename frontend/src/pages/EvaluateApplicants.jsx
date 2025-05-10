// frontend/src/pages/EvaluateApplicants.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FaUserGraduate, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner,
  FaSearch, FaEnvelope, FaPhone, FaUser, FaVenusMars, FaBook,
  FaCalendarAlt, FaExclamationTriangle, FaSave, FaBuilding, FaUsers
} from 'react-icons/fa'; // Import desired icons
import styles from './EvaluateApplicants.module.css'; // Import the CSS module

// Helper component for Status Badges
const StatusBadge = ({ status }) => {
  let icon;
  let text;
  let className;

  switch (status) {
    case 'approved':
      icon = <FaCheckCircle />;
      text = 'Approved';
      className = styles.statusApproved;
      break;
    case 'rejected':
      icon = <FaTimesCircle />;
      text = 'Rejected';
      className = styles.statusRejected;
      break;
    case 'pending':
    default:
      icon = <FaClock />;
      text = 'Pending';
      className = styles.statusPending;
      break;
  }

  return (
    <span className={`${styles.statusBadge} ${className}`}>
      {icon} {text}
    </span>
  );
};


const EvaluateApplicants = () => {
  const { semester } = useParams();
  const [club, setClub] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState({}); // Track update status per applicant

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    setApplicants([]); // Clear previous applicants
    setClub(null); // Clear previous club details
    try {
      const clubRes = await axios.get('http://localhost:3001/api/clubs/dashboard');
      if (!clubRes.data || !clubRes.data.clubDetails) {
        throw new Error("Failed to retrieve valid club details.");
      }
      const fetchedClub = clubRes.data.clubDetails;
      setClub(fetchedClub);

      const applicantsRes = await axios.get(`http://localhost:3001/api/recruitment/applicants/${fetchedClub._id}/${semester}`);
      if (applicantsRes.data && Array.isArray(applicantsRes.data.applicants)) {
        const initialApplicants = applicantsRes.data.applicants.map(app => ({
          ...app,
          selectedStatus: app.status // Initialize dropdown based on fetched status
        }));
        setApplicants(initialApplicants);
      } else {
        setApplicants([]);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred";
      if (err.response?.status === 401) {
        setError("Authentication error. Please log in again.");
        // Consider redirecting to login here
      } else {
        setError(`Error loading data: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [semester]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (uid, newSelectedStatus) => {
    setApplicants(prevApplicants =>
      prevApplicants.map(app =>
        app.uid === uid ? { ...app, selectedStatus: newSelectedStatus } : app
      )
    );
  };

  const handleSubmitUpdate = async (uid) => {
    if (!club) {
      setError("Cannot update applicant: Club data not loaded.");
      return;
    }

    const applicantToUpdate = applicants.find(app => app.uid === uid);
    if (!applicantToUpdate) {
      setError("Applicant not found for update.");
      return;
    }

    const newStatus = applicantToUpdate.selectedStatus;
    // Prevent submitting if status hasn't changed
    if (newStatus === applicantToUpdate.status) return;

    setUpdatingStatus(prev => ({ ...prev, [uid]: true })); // Set loading state for this specific applicant
    setError(''); // Clear previous action-specific errors

    try {
      await axios.post('http://localhost:3001/api/recruitment/evaluate', {
        clubId: club._id,
        semester,
        uid,
        action: newStatus
      });

      // Update the actual 'status' in local state upon success
      setApplicants(prevApplicants =>
        prevApplicants.map(app =>
          app.uid === uid ? { ...app, status: newStatus } : app
        )
      );
      // Optional: Add a success toast notification here

    } catch (err) {
      console.error("Error updating applicant status:", err);
      const updateError = err.response?.data?.message || err.message || "Failed to update status.";
      setError(`Error updating UID ${uid}: ${updateError}`);
      // Optional: Add an error toast notification here
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [uid]: false })); // Remove loading state for this applicant
    }
  };

  // Calculate counts based on the *confirmed* status
  const counts = {
    pending: applicants.filter(a => a.status === 'pending').length,
    approved: applicants.filter(a => a.status === 'approved').length,
    rejected: applicants.filter(a => a.status === 'rejected').length,
  };

  const filteredApplicants = applicants.filter(a =>
    (a.uname && a.uname.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.uid && a.uid.toString().includes(searchTerm))
  );

  // Render Loading State
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.spinner} />
        <p>Loading Applicant Data...</p>
      </div>
    );
  }

  // Render Error State (if critical data like club info failed)
  if (error && !club) {
     return (
      <div className={styles.errorContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <p>{error}</p>
        <button onClick={fetchData} className={styles.retryButton}>Retry</button>
      </div>
     );
  }

  // Render when no club data (even if not loading/error, should not happen with current logic but good practice)
  if (!club) {
     return (
       <div className={styles.errorContainer}>
         <FaExclamationTriangle className={styles.errorIcon} />
         <p>Club information is unavailable.</p>
       </div>
     );
  }

  // Main Render Logic
  return (
    <div className={styles.evaluatePage}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <FaUserGraduate size={30} />
          <h1>Evaluate Applicants</h1>
          <span>{semester}</span>
        </div>
        <div className={styles.clubInfo}>
          <FaBuilding /> {club?.cname || 'Club Name Unavailable'}
        </div>
       {/* Display non-critical errors (e.g., update errors) here */}
        {error && <div className={styles.inlineError}><FaExclamationTriangle /> {error}</div>}
      </header>

      <div className={styles.controlsContainer}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by Name or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchBox}
            />
          </div>
          <div className={styles.statsContainer}>
             <span className={styles.statItem}><FaClock /> Pending: <strong>{counts.pending}</strong></span>
             <span className={styles.statItem}><FaCheckCircle /> Approved: <strong>{counts.approved}</strong></span>
             <span className={styles.statItem}><FaTimesCircle /> Rejected: <strong>{counts.rejected}</strong></span>
             <span className={styles.statItem}><FaUsers /> Total: <strong>{applicants.length}</strong></span>
          </div>
      </div>


      <div className={styles.applicantsGrid}>
        {filteredApplicants.length > 0 ? (
          filteredApplicants.map(app => {
            const isUpdating = updatingStatus[app.uid];
            const hasChanged = app.status !== app.selectedStatus;
            return (
            <div key={app.uid} className={`${styles.applicantCard} ${isUpdating ? styles.cardUpdating : ''}`}>
               <div className={styles.cardHeader}>
                <h3 className={styles.applicantName}>{app.uname || 'Unnamed Applicant'}</h3>
                <span className={styles.applicantId}>ID: {app.uid}</span>
              </div>

               <div className={styles.cardBody}>
                <p><FaEnvelope className={styles.infoIcon} /> {app.umail || 'N/A'}</p>
                <p><FaPhone className={styles.infoIcon} /> {app.umobile || 'N/A'}</p>
                <p><FaVenusMars className={styles.infoIcon} /> {app.ugender || 'N/A'}</p>
                <p><FaBook className={styles.infoIcon} /> {app.major || 'N/A'}</p>
                <p><FaCalendarAlt className={styles.infoIcon} /> {app.semester || 'N/A'}</p>
              </div>

               <div className={styles.cardStatus}>
                 <strong>Current Status:</strong> <StatusBadge status={app.status} />
              </div>

              <div className={styles.cardControls}>
                <select
                  value={app.selectedStatus}
                  onChange={e => handleStatusChange(app.uid, e.target.value)}
                  className={styles.statusSelect}
                  disabled={isUpdating}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={() => handleSubmitUpdate(app.uid)}
                  className={styles.submitButton}
                  disabled={isUpdating || !hasChanged} // Disable if updating or if status hasn't changed
                >
                  {isUpdating ? <FaSpinner className={styles.buttonSpinner} /> : <FaSave />}
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          )})
        ) : (
          <div className={styles.noApplicants}>
             <FaUserGraduate size={50} color="#ccc" />
             <p>No applicants found{searchTerm ? ' matching your search criteria' : ' for this semester'}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluateApplicants;