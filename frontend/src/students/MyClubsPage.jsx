import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Using axios for consistency and better error handling
import {
  FaUsers, FaSearch, FaSpinner, FaExclamationCircle,
  FaUniversity, FaTag, FaUser, FaEnvelope, FaPhone, FaInfoCircle, FaPaperPlane
} from 'react-icons/fa'; // Import icons
import './MyClubs.css'; // Import the CSS file

const MyClubsPage = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false); // State for search button loading
  const navigate = useNavigate();

  // It's generally better to get auth info from context or state if possible,
  // but using localStorage as per your original code for now.
  const studentId = localStorage.getItem('studentId');
  const studentName = localStorage.getItem('studentName');
  const authToken = localStorage.getItem('token'); // Get token from localStorage

  const fetchClubs = async (query = '') => {
    setLoading(true); // Set loading true at the start of fetch
    setError(''); // Clear previous errors
    try {
      let url = `http://localhost:3001/api/students/${studentId}/myclubs`;

      if (query.trim()) {
        url = `http://localhost:3001/api/students/${studentId}/myclubs/search?query=${encodeURIComponent(query)}`;
      }

      const response = await axios.get(url, {
        withCredentials: true, // Assuming cookies are used for session/auth
        headers: {
           // Include Authorization header if using token-based auth
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });

      if (response.status !== 200) { // Axios throws for non-2xx, but good to check
         throw new Error(response.data.message || `HTTP error! status: ${response.status}`);
      }

      setClubs(response.data);
      setError(''); // Clear error on successful fetch
      return response.data;

    } catch (err) {
      console.error('API Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch clubs';
      setError(errorMessage);
      setClubs([]); // Clear clubs on error
      if (err.response?.status === 401 || err.response?.status === 403) {
         // Redirect to login if unauthorized or forbidden
         navigate('/student/login');
      }
      throw err; // Re-throw to be caught by the calling function if needed
    } finally {
      setLoading(false); // Set loading false when fetch is complete
      setIsSearching(false); // Also stop search loading
    }
  };

  useEffect(() => {
    if (!studentId) {
      navigate('/student/login');
      return;
    }

    // Initial load without search query
    fetchClubs();

  }, [studentId, navigate, authToken]); // Add authToken to dependencies if it changes

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true); // Start search loading
    // fetchClubs will handle setting main loading state and clearing error
    fetchClubs(searchQuery);
  };

  // Redirect if studentId is not available (should be caught by useEffect too)
  if (!studentId) {
      return <div className="myclubs-container error-page"><p>Authentication required. Redirecting...</p></div>;
  }


  return (
    <div className="myclubs-container"> {/* Scoped class */}
      <h1 className="page-title"><FaUsers className="icon" /> {studentName}'s Clubs</h1>

      {/* Error Message Display */}
      {error && (
        <div className="global-message error"> {/* Using global-message class */}
          <FaExclamationCircle className="message-icon" />
          <p>{error}</p>
          {/* Optional: Add a retry button if appropriate */}
          {/* <button onClick={() => fetchClubs(searchQuery)} className="retry-button">Retry</button> */}
        </div>
      )}

      {/* Search Form */}
      <div className="search-form-container"> {/* Container for search form */}
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="input-icon-wrapper"> {/* Wrapper for input and icon */}
             <FaSearch className="input-icon" />
             <input
               type="text"
               placeholder="Search by club name, short name, or ID..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               disabled={loading} // Disable input while loading (initial or search)
               className="search-input"
             />
          </div>
          <button type="submit" disabled={loading || isSearching} className="search-button">
            {isSearching ? <FaSpinner className="button-icon spinner-icon" /> : <FaSearch className="button-icon" />}
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && !error && ( // Only show loading spinner if no error
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading clubs...</p>
        </div>
      )}

      {/* No Clubs Found State */}
      {!loading && !error && clubs.length === 0 && (
        <div className="no-clubs-found">
          <p>No clubs found. {searchQuery && 'Try a different search query.'}</p>
        </div>
      )}

      {/* Clubs Grid */}
      {!loading && !error && clubs.length > 0 && (
        <div className="clubs-grid">
          {clubs.map(club => (
            <div key={club._id || club.cid} className="club-card"> {/* Use _id or cid as key */}
              <div className="card-header">
                 <img
                    src={club.clogo || 'https://placehold.co/80x80/E1BEE7/673AB7?text=Logo'} // Placeholder with theme colors
                    alt={`${club.cname || 'Club'} logo`}
                    className="club-logo"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/E1BEE7/673AB7?text=Logo'; }} // Fallback on error
                  />
                <div className="club-titles">
                    <h2 className="club-name">{club.cname}</h2>
                    <span className="club-id">ID: {club.cid}</span>
                </div>
              </div>

              <div className="card-body">
                <p><FaTag className="icon" /> <strong>Short Name:</strong> {club.cshortname || 'N/A'}</p>
                <p><FaUser className="icon" /> <strong>President:</strong> {club.cpname || 'N/A'}</p>
                <p><FaEnvelope className="icon" /> <strong>Email:</strong> {club.cmail || 'N/A'}</p>
                <p><FaPhone className="icon" /> <strong>Mobile:</strong> {club.cmobile || 'N/A'}</p>

                {club.cdescription && (
                  <div className="club-description">
                    <h4><FaInfoCircle className="icon" /> Description:</h4>
                    <p>{club.cdescription}</p>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <a href={`mailto:${club.cmail}`} className="contact-btn">
                   <FaPaperPlane className="button-icon" /> Contact Club
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClubsPage;
