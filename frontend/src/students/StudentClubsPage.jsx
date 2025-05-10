import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Use axios for fetching data
import {
  FaUniversity, FaUsers, FaCalendarAlt, FaTrophy, FaGlobe, FaUser,
  FaInfoCircle, FaTimes, FaSearch, FaPlusCircle, FaEye
} from 'react-icons/fa'; // Import icons
import './StudentClubsPage.css'; // Import the CSS file

const StudentClubsPage = () => {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // State for search term
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:3001/api/clubs/all');
        setClubs(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching clubs:', err);
        setError('Failed to load clubs. Please try again later.');
        setLoading(false);
      }
    };

    fetchClubs();
  }, []); // Empty dependency array means this runs once on mount

  const handleCloseModal = () => setSelectedClub(null);

  const handleCardClick = (club) => {
    setSelectedClub(club);
  };

  // Filter clubs based on search term
  const filteredClubs = clubs.filter(club =>
    club.cname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.cdescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.caname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.cpname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.cshortname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render Loading, Error, or No Clubs states
  if (loading) {
    return (
      <div className="student-clubs-page loading-page"> {/* Scoped class */}
        <h1 className="page-title"><FaUniversity className="icon" /> All University Clubs</h1>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading clubs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-clubs-page error-page"> {/* Scoped class */}
        <h1 className="page-title"><FaUniversity className="icon" /> All University Clubs</h1>
        <div className="error-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-clubs-page"> {/* Scoped class */}
      <h1 className="page-title"><FaUniversity className="icon" /> All University Clubs</h1>

      <div className="controls-area"> {/* Container for search and buttons */}
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search clubs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-box"
          />
        </div>
        <div className="action-buttons"> {/* Renamed for clarity */}
          <button onClick={() => navigate('/student/myclubs')} className="action-button my-clubs-button">
            <FaUsers className="button-icon" /> My Clubs
          </button>
          <button onClick={() => navigate('/student/joinclubs')} className="action-button join-clubs-button">
            <FaPlusCircle className="button-icon" /> Join Clubs
          </button>
        </div>
      </div>


      {filteredClubs.length === 0 && !loading && !error && (
         <div className="no-clubs-found">
            <p>No clubs found matching your search.</p>
         </div>
      )}

      <div className="club-grid">
        {filteredClubs.map((club) => (
          <div
            key={club._id}
            className="club-card"
            onClick={() => handleCardClick(club)} // Make the whole card clickable
          >
            <div className="card-header">
              <img
                src={club.clogo || 'https://placehold.co/100x100/E1BEE7/673AB7?text=Logo'} // Placeholder with theme colors
                alt={`${club.cname || 'Club'} Logo`}
                className="club-logo"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/E1BEE7/673AB7?text=Logo'; }} // Fallback on error
              />
              <div className="club-titles">
                 <h2 className="club-name">{club.cname}</h2>
                 <p className="club-shortname">{club.cshortname}</p>
              </div>
            </div>
            <div className="card-body">
              <p><FaUser className="icon" /> <strong>Advisor:</strong> {club.caname || 'N/A'}</p>
              <p><FaUser className="icon" /> <strong>President:</strong> {club.cpname || 'N/A'}</p>
              {/* Optionally add a short description snippet */}
              {club.cdescription && (
                 <p className="club-description-snippet">
                    <FaInfoCircle className="icon" /> {club.cdescription.substring(0, 100)}... {/* Show first 100 chars */}
                 </p>
              )}
            </div>
            <div className="card-footer">
               <button className="details-button">
                  <FaEye className="button-icon" /> View Details
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Club Details Modal */}
      {selectedClub && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={handleCloseModal}>
              <FaTimes />
            </button>
            <div className="modal-header">
                <img
                    src={selectedClub.clogo || 'https://placehold.co/100x100/E1BEE7/673AB7?text=Logo'} // Placeholder
                    alt={`${selectedClub.cname || 'Club'} Logo`}
                    className="modal-club-logo"
                     onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/E1BEE7/673AB7?text=Logo'; }} // Fallback on error
                />
                <div className="modal-titles">
                    <h2 className="modal-club-name">{selectedClub.cname}</h2>
                    <p className="modal-club-shortname">{selectedClub.cshortname}</p>
                </div>
            </div>
            <div className="modal-body">
              <p><FaInfoCircle className="icon" /> <strong>Description:</strong> {selectedClub.cdescription || 'N/A'}</p>
              <p><FaCalendarAlt className="icon" /> <strong>Founded:</strong> {selectedClub.cdate ? new Date(selectedClub.cdate).toLocaleDateString() : 'N/A'}</p>
              <p><FaTrophy className="icon" /> <strong>Achievements:</strong> {selectedClub.cachievement || 'N/A'}</p>
              <p><FaGlobe className="icon" /> <strong>Social Links:</strong> {selectedClub.csocial ? <a href={selectedClub.csocial} target="_blank" rel="noopener noreferrer">{selectedClub.csocial}</a> : 'N/A'}</p>
              {/* Add other details as needed */}
               <p><FaUser className="icon" /> <strong>Advisor:</strong> {selectedClub.caname || 'N/A'}</p>
               <p><FaUser className="icon" /> <strong>President:</strong> {selectedClub.cpname || 'N/A'}</p>
            </div>
             {/* Optional: Add a "Join Club" button here if applicable to this page */}
             {/* <div className="modal-actions">
                <button className="action-button join-club-modal-button">Join Club</button>
             </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClubsPage;
