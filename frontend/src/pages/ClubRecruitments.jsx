import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Building,
  BadgeInfo, // Or Briefcase
  CalendarDays,
  Megaphone,
  PlayCircle,
  XCircle,
  CalendarClock,
  FileText,
  Send,
  ListChecks,
  StopCircle,
  Loader,
  AlertTriangle,
  Users,
  UserCheck,
  UserX,
  CheckCircle,
  Info,
  LogIn,
  RotateCw,
  Archive, // For history title
  Edit3, // For description icon
  Target // For current semester/status
} from 'lucide-react';
import styles from './ClubRecruitments.module.css';

const ClubRecruitments = () => {
  const navigate = useNavigate();
  const [recruitments, setRecruitments] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const currentSemester = 'Spring 2025'; // Consider making this dynamic

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setStatusMessage({ type: '', text: '' });
    try {
      const clubRes = await axios.get('http://localhost:3001/api/clubs/dashboard', { withCredentials: true });
      if (clubRes.data && clubRes.data.clubDetails) {
        const fetchedClub = clubRes.data.clubDetails;
        setClub(fetchedClub);
        const recruitmentRes = await axios.get(`http://localhost:3001/api/recruitment/${fetchedClub._id}`, { withCredentials: true });
        setRecruitments(recruitmentRes.data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      } else {
        throw new Error("Club details not found. You might not be logged in or authorized.");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || err.message || "Failed to load data. Please ensure you are logged in as a club representative.");
      setClub(null);
      setRecruitments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startRecruitment = async () => {
    if (!club || !deadline || !description.trim()) {
      setStatusMessage({ type: 'error', text: 'Please set a deadline and provide a description.' });
      return;
    }
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await axios.post('http://localhost:3001/api/recruitment/create', {
        clubId: club._id,
        clubName: club.cname,
        semester: currentSemester,
        application_deadline: deadline,
        description
      }, { withCredentials: true });

      setStatusMessage({ type: 'success', text: res.data.message || 'Recruitment started successfully!' });
      setRecruitments(prev => [res.data.recruitment, ...prev.filter(r => r.semester !== currentSemester)]);
      setDescription('');
      // setDeadline(''); // Keep or clear deadline based on preference
    } catch (err) {
      console.error("Error starting recruitment:", err);
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to start recruitment.' });
    }
  };

  const stopRecruitment = async (semester) => {
    if (!club) return;
    if (!window.confirm(`Are you sure you want to stop recruitment for ${semester}? This action cannot be undone.`)) {
      return;
    }
    setStatusMessage({ type: '', text: '' });
    try {
      await axios.put('http://localhost:3001/api/recruitment/stop', {
        clubId: club._id,
        semester
      }, { withCredentials: true });

      setRecruitments(prev => prev.map(r => r.semester === semester ? { ...r, status: 'no' } : r));
      setStatusMessage({ type: 'info', text: `Recruitment for ${semester} has been successfully stopped.` });
    } catch (err) {
      console.error("Error stopping recruitment:", err);
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to stop recruitment.' });
    }
  };

  const currentRecruitmentInfo = recruitments.find(r => r.semester === currentSemester);
  const isCurrentlyRecruiting = currentRecruitmentInfo?.status === 'yes';

  const totalPending = recruitments.reduce((sum, r) => sum + (r.pending_std?.length || 0), 0);
  const totalApproved = recruitments.reduce((sum, r) => sum + (r.approved_std?.length || 0), 0);
  const totalRejected = recruitments.reduce((sum, r) => sum + (r.rejected_std?.length || 0), 0);


  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader className={styles.spinner} size={50} />
        <p>Loading Recruitment Dashboard...</p>
      </div>
    );
  }

  if (error && !club) {
    return (
      <div className={styles.errorPageContainer}> {/* Use a generic container for error pages */}
        <AlertTriangle size={48} className={styles.errorIconColor} />
        <h2 className={styles.errorTitle}>Access Denied or Data Missing</h2>
        <p className={styles.errorMessage}>{error}</p>
        <p className={styles.errorMessage}>Please ensure you are logged in with appropriate club credentials.</p>
        <div className={styles.errorActions}>
            <button onClick={() => navigate('/login')} className={`${styles.primaryButton} ${styles.errorButton}`}>
                <LogIn size={18} className={styles.buttonIcon} /> Go to Login
            </button>
            <button onClick={fetchData} className={`${styles.secondaryButton} ${styles.errorButton}`}>
                <RotateCw size={18} className={styles.buttonIcon} /> Retry
            </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorPageContainer}>
        <AlertTriangle size={48} className={styles.errorIconColor} />
        <h2 className={styles.errorTitle}>An Error Occurred</h2>
        <p className={styles.errorMessage}>{error}</p>
         <button onClick={fetchData} className={`${styles.primaryButton} ${styles.errorButton}`}>
            <RotateCw size={18} className={styles.buttonIcon} /> Try Again
        </button>
      </div>
    );
  }

  if (!club) {
      return (
        <div className={styles.errorPageContainer}>
            <AlertTriangle size={48} className={styles.errorIconColor} />
            <h2 className={styles.errorTitle}>Club Information Unavailable</h2>
            <p className={styles.errorMessage}>Could not load club details. Please try logging in again or retrying.</p>
            <div className={styles.errorActions}>
                <button onClick={() => navigate('/login')} className={`${styles.primaryButton} ${styles.errorButton}`}>
                    <LogIn size={18} className={styles.buttonIcon} /> Login Again
                </button>
                <button onClick={fetchData} className={`${styles.secondaryButton} ${styles.errorButton}`}>
                    <RotateCw size={18} className={styles.buttonIcon} /> Retry
                </button>
            </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Recruitment Dashboard</h1>
          <p className={styles.heroSubtitle}>Manage your club's recruitment drives, track applicants, and streamline your selection process.</p>
          <div className={styles.clubDetails}>
            <span><Building size={20} /> {club.cname}</span>
            <span><BadgeInfo size={20} /> Club ID: {club.cid}</span>
          </div>
        </div>
        <div className={styles.heroImage}>
          <Megaphone size={80} className={styles.heroIcon} />
        </div>
      </div>

      {/* Status Message Area - Placed after Hero, before other content */}
      {statusMessage.text && (
        <div className={`${styles.statusMessageOuter} ${styles[statusMessage.type]}`}>
            <div className={styles.statusIconWrapper}>
                {statusMessage.type === 'success' && <CheckCircle />}
                {statusMessage.type === 'error' && <AlertTriangle />}
                {statusMessage.type === 'info' && <Info />}
            </div>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage({ type: '', text: '' })} className={styles.closeStatusMessage}>&times;</button>
        </div>
      )}

      {/* Current Recruitment Status & Quick Stats */}
      <div className={styles.analyticsSection}>
        <h2 className={styles.sectionTitle}><Target size={24} className={styles.titleIcon} />Overview</h2>
        <div className={styles.analyticsGrid}>
          <div className={`${styles.analyticsCard} ${styles.infoCard}`}>
            <CalendarDays size={30} className={styles.analyticsIcon} />
            <span className={styles.analyticsLabel}>Current Semester</span>
            <span className={styles.analyticsCount}>{currentSemester}</span>
          </div>
          <div className={`${styles.analyticsCard} ${isCurrentlyRecruiting ? styles.activeRecruitmentCard : styles.inactiveRecruitmentCard}`}>
            {isCurrentlyRecruiting ? <PlayCircle size={30} className={styles.analyticsIcon} /> : <XCircle size={30} className={styles.analyticsIcon} />}
            <span className={styles.analyticsLabel}>Recruitment Status</span>
            <span className={styles.analyticsCountMedium}>{isCurrentlyRecruiting ? 'OPEN' : 'CLOSED'}</span>
          </div>
           <div className={`${styles.analyticsCard} ${styles.pendingCard}`}>
                <Users size={30} className={styles.analyticsIcon} />
                <span className={styles.analyticsLabel}>Total Pending Applicants</span>
                <span className={styles.analyticsCount}>{totalPending}</span>
            </div>
            <div className={`${styles.analyticsCard} ${styles.approvedCard}`}>
                <UserCheck size={30} className={styles.analyticsIcon} />
                <span className={styles.analyticsLabel}>Total Approved</span>
                <span className={styles.analyticsCount}>{totalApproved}</span>
            </div>
        </div>
      </div>


      {/* Action Section: Start or Manage Recruitment */}
      <div className={styles.contentSection}>
        {!isCurrentlyRecruiting && (
          <>
            <h2 className={styles.sectionTitle}><Send size={24} className={styles.titleIcon} /> Launch New Recruitment Drive</h2>
            <div className={styles.formContainer}>
              <div className={styles.formGroup}>
                <label htmlFor="deadline"><CalendarClock size={18} /> Application Deadline</label>
                <input
                  id="deadline" type="date" value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className={styles.formInput}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="description"><Edit3 size={18} /> Recruitment Description & Details</label>
                <textarea
                  id="description" value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide details about the recruitment process, requirements, positions available, key dates, etc."
                  className={styles.formTextarea}
                  rows={5}
                />
              </div>
              <button onClick={startRecruitment} className={`${styles.primaryButton} ${styles.submitButton}`}>
                <Send size={18} className={styles.buttonIcon} /> Start Recruitment
              </button>
            </div>
          </>
        )}

        {isCurrentlyRecruiting && currentRecruitmentInfo && (
          <>
            <h2 className={styles.sectionTitle}><ListChecks size={24} className={styles.titleIcon} /> Manage Active Recruitment: {currentRecruitmentInfo.semester}</h2>
            <div className={styles.currentRecruitmentInfoBox}>
                <p><strong><FileText size={16} /> Description:</strong> {currentRecruitmentInfo.description || "No description provided."}</p>
                <p><strong><CalendarClock size={16} /> Deadline:</strong> {currentRecruitmentInfo.application_deadline ? new Date(currentRecruitmentInfo.application_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </p>
            </div>
            <div className={styles.actionButtonsContainer}>
                <button
                    onClick={() => navigate(`/club/recruitments/evaluate/${currentRecruitmentInfo.semester}`)}
                    className={`${styles.primaryButton}`}
                    title="View and evaluate applicants"
                >
                    <ListChecks size={18} className={styles.buttonIcon} /> Evaluate Applicants
                </button>
                <button
                    onClick={() => stopRecruitment(currentRecruitmentInfo.semester)}
                    className={`${styles.dangerButton}`}
                    title="Stop accepting new applications for this semester"
                >
                    <StopCircle size={18} className={styles.buttonIcon} /> Stop Recruitment
                </button>
            </div>
          </>
        )}
      </div>


      {/* Past Recruitments Section */}
      <div className={styles.contentSection}>
        <h2 className={styles.sectionTitle}><Archive size={24} className={styles.titleIcon} /> Recruitment Archives</h2>
        {recruitments.filter(r => r.semester !== currentSemester || (r.semester === currentSemester && r.status === 'no')).length === 0 && !isCurrentlyRecruiting ? (
          <div className={styles.noDataMessage}>
            <Info size={24} className={styles.infoIcon} />
            <p>No past recruitment drives found. Completed recruitments will appear here.</p>
          </div>
        ) : (
          <div className={styles.recruitmentGrid}>
            {recruitments
                .filter(rec => rec.status === 'no' || rec.semester !== currentSemester) // Filter for completed or past
                .map(rec => (
              <div key={rec._id || rec.semester} className={styles.recruitmentCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{rec.semester}</h3>
                  <span className={`${styles.cardStatus} ${rec.status === 'yes' ? styles.statusActive : styles.statusConcluded}`}>
                    {rec.status === 'yes' ? <PlayCircle size={14} /> : <CheckCircle size={14} />}
                    {rec.status === 'yes' ? 'Was Active' : 'Concluded'}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardDescription}>
                    {rec.description?.substring(0, 120) || "No specific description was provided for this drive."}
                    {rec.description?.length > 120 && "..."}
                  </p>
                  <div className={styles.applicantStats}>
                    <div className={styles.statItem}><Users size={16} /> Pending: <strong>{rec.pending_std?.length || 0}</strong></div>
                    <div className={styles.statItem}><UserCheck size={16} /> Approved: <strong>{rec.approved_std?.length || 0}</strong></div>
                    <div className={styles.statItem}><UserX size={16} /> Rejected: <strong>{rec.rejected_std?.length || 0}</strong></div>
                  </div>
                  <p className={styles.cardDeadline}>
                    <CalendarClock size={14} /> Deadline was: {rec.application_deadline ? new Date(rec.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
                <div className={styles.cardFooter}>
                  <button
                    onClick={() => navigate(`/club/recruitments/evaluate/${rec.semester}`)}
                    className={`${styles.secondaryButton} ${styles.smallButton}`}
                  >
                    <ListChecks size={16} className={styles.buttonIcon} /> Review Applicants
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubRecruitments;