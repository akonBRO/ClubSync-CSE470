import React, { useState, useEffect } from 'react';
import './JoinClubsPage.css'; // Ensure this path is correct

// Import React Icons (Material Design)
import {
  MdGroups,
  MdSearch,
  MdOutlineEditNote,
  MdCalendarToday,
  MdHourglassEmpty,
  MdInfoOutline,
  MdPersonAdd,
  MdPendingActions,
  MdCheckCircle,
  MdCancel,
  MdErrorOutline,
  MdSearchOff,
  MdAccessTime // Alternative for Deadline or Applied
} from 'react-icons/md';

const API_BASE_URL = 'http://localhost:3001/api';

function JoinClubsPage() {
  const [recruitingClubs, setRecruitingClubs] = useState([]);
  const [filteredClubs, setFilteredClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const initializePage = async () => {
      try {
        const authResponse = await fetch(`${API_BASE_URL}/students/check-auth`, {
          credentials: 'include'
        });
        const authData = await authResponse.json();

        if (!authData.isLoggedIn) {
          window.location.href = '/login';
          return;
        }

        setStudent(authData.student);

        const clubsResponse = await fetch(`${API_BASE_URL}/recruitment/recruiting/active`, {
          credentials: 'include'
        });
        const clubsData = await clubsResponse.json();

        const normalizedClubs = clubsData.map(club => ({
          ...club,
          pending_std: club.pending_std || [],
          approved_std: club.approved_std || [],
          rejected_std: club.rejected_std || []
        }));

        setRecruitingClubs(normalizedClubs);
        setFilteredClubs(normalizedClubs);

        const countResponse = await fetch(`${API_BASE_URL}/students/pending-count`, {
          credentials: 'include'
        });
        const countData = await countResponse.json();
        setPendingCount(countData.pendingCount || 0);

      } catch (err) {
        console.error("Initialization error:", err);
        setError("Oops! We couldn't load club data. Please refresh or try again later.");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredClubs(recruitingClubs);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = recruitingClubs.filter(club =>
      club.clubName.toLowerCase().includes(term) ||
      String(club.cid).includes(term)
    );
    setFilteredClubs(filtered);
  }, [searchTerm, recruitingClubs]);

  const handleRegister = async (recruitmentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/students/register-club`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recruitmentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed. You might already be part of this club or have a pending application.');
      }

      const result = await response.json();
      setPendingCount(result.pendingCount || pendingCount + 1);

      setRecruitingClubs(prev =>
        prev.map(club => {
          if (club._id === recruitmentId && student?.uid) {
            return {
              ...club,
              pending_std: [...(club.pending_std || []), student.uid]
            };
          }
          return club;
        })
      );

      alert(result.message || 'Registration successful! Your application is pending.');
    } catch (err) {
      console.error('Registration error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="student-clubs-page">
        <div className="page-title">
          <MdGroups className="title-icon" aria-label="Clubs Icon" />
          Discover & Join Clubs
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available clubs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-clubs-page">
        <div className="page-title">
          <MdGroups className="title-icon" aria-label="Clubs Icon" />
          Discover & Join Clubs
        </div>
        <div className="error-state">
          <MdErrorOutline className="error-icon" aria-label="Error Icon" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="student-clubs-page">
      <div className="page-title">
        <MdGroups className="title-icon" aria-label="Clubs Icon" />
        Discover & Join Clubs
      </div>

      <div className="controls-area">
        <div className="search-container">
          <MdSearch className="search-icon" />
          <input
            type="text"
            className="search-box"
            placeholder="Search by club name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="pending-count">
          <MdOutlineEditNote className="icon" />
          Pending Applications: <span>{pendingCount}</span>
        </div>
      </div>

      <div className="club-grid">
        {filteredClubs.length > 0 ? (
          filteredClubs.map(club => {
            const studentUid = student?.uid;
            const pendingStudents = club.pending_std || [];
            const approvedStudents = club.approved_std || [];
            const rejectedStudents = club.rejected_std || [];

            const isPending = studentUid && pendingStudents.includes(studentUid);
            const isApproved = studentUid && approvedStudents.includes(studentUid);
            const isRejected = studentUid && rejectedStudents.includes(studentUid);

            let statusDisplayInfo = null; // Will hold JSX for status or null
            let buttonContent = <><MdPersonAdd /> Register</>;
            let buttonDisabled = false;
            
            if (isApproved) {
              statusDisplayInfo = <span className="status approved"><MdCheckCircle /> Approved</span>;
              buttonDisabled = true; // Also disable button if already decided
            } else if (isRejected) {
              statusDisplayInfo = <span className="status rejected"><MdCancel /> Rejected</span>;
              buttonDisabled = true; // Also disable button if already decided
            } else if (isPending) {
              buttonContent = <><MdPendingActions /> Applied</>;
              buttonDisabled = true;
            }

            return (
              <div key={club._id} className="club-card">
                <div className="card-header">
                  <div className="club-titles">
                    <h3 className="club-name">{club.clubName}</h3>
                    <p className="club-shortname">ID: {club.cid}</p>
                  </div>
                </div>
                <div className="card-body">
                  <p><MdCalendarToday className="icon" /><strong>Semester:</strong> {club.semester}</p>
                  <p><MdAccessTime className="icon" /><strong>Deadline:</strong> {new Date(club.application_deadline).toLocaleDateString()}</p>
                  <div className="description-container">
                      <MdInfoOutline className="icon" />
                      <div>
                          <strong>Description:</strong>
                          <p className="club-description-snippet">
                              {club.description || 'No description available for this club.'}
                          </p>
                      </div>
                  </div>
                </div>
                <div className="card-footer">
                  {statusDisplayInfo ? (
                    statusDisplayInfo
                  ) : (
                    <button
                      className="details-button"
                      onClick={() => handleRegister(club._id)}
                      disabled={buttonDisabled}
                    >
                      {buttonContent}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-clubs-found">
             <MdSearchOff className="no-results-icon" aria-label="No results icon"/>
            <p>
              {recruitingClubs.length === 0
                ? 'No clubs are currently recruiting. Check back later!'
                : 'No clubs match your search criteria.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default JoinClubsPage;