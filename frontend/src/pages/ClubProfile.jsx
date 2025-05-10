import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaSave, FaEnvelope, FaPhone, FaLock, FaInfoCircle, FaCalendarAlt, FaTrophy, FaGlobe, FaBuilding, FaUserTie, FaUsers, FaTag, FaImage, FaTimesCircle, FaSpinner } from 'react-icons/fa'; // Added FaSpinner for loading button
import './ClubProfile.css'; // Import the CSS file

const ClubProfile = () => {
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [editedClub, setEditedClub] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [message, setMessage] = useState(''); // State for success/error messages
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [isSaving, setIsSaving] = useState(false); // State for save button loading

  const cid = localStorage.getItem('cid');

  useEffect(() => {
    const storedCid = localStorage.getItem('cid');
    console.log('Retrieved CID from localStorage:', storedCid);

    if (!storedCid) {
      console.error("No cid found in localStorage");
      setMessage("Please log in to view your profile.");
      setMessageType('error');
      setTimeout(() => navigate('/login-club'), 2000); // Redirect after a delay
      setLoading(false);
      return;
    }

    setLoading(true);
    axios.get(`http://localhost:3001/api/clubs/${storedCid}`) // Use storedCid directly
      .then(res => {
        setClub(res.data);
        setEditedClub(res.data);
        // Set initial logo preview if it exists
        if (res.data.clogo) {
          setLogoPreview(res.data.clogo);
        }
        setLoading(false);
        setMessage(''); // Clear previous messages
        setMessageType('');
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setMessage("Failed to load club data. Please try again later.");
        setMessageType('error');
        setLoading(false);
        // Optional: clear the message after a few seconds
        setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
      });
  }, [navigate]); // navigate is a stable dependency

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedClub({ ...editedClub, [name]: value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      // Note: We don't set editedClub.clogo here immediately to avoid issues
      // with FormData. The backend should handle saving the new logo and
      // updating the club data with the new path.
    }
  };

  const handleSave = async () => {
    setIsSaving(true); // Show loading during save
    setMessage(''); // Clear previous messages
    setMessageType('');

    const formData = new FormData();

    // Append the logo file if it exists
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    // Append other club data
    // Filter out fields that shouldn't be updated by the club (like cname, cshortname)
    const dataToSave = { ...editedClub };
    delete dataToSave.cname; // Prevent club from changing name
    delete dataToSave.cshortname; // Prevent club from changing short name
    // Note: cid is also immutable, but it's not in editedClub anyway.

    formData.append('clubData', JSON.stringify(dataToSave));

    try {
      const res = await axios.put(
        `http://localhost:3001/api/clubs/${cid}/edit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setClub(res.data);
      setEditedClub(res.data);
      // Update logo preview if the logo was changed and the update was successful
      if (logoFile) {
        setLogoPreview(res.data.clogo); // Use the path returned by the server
        setLogoFile(null); // Clear the file input state
      }

      setEditMode(false);
      setIsSaving(false);
      setMessage("Profile updated successfully!");
      setMessageType('success');
      // Optional: clear the message after a few seconds
      setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);

    } catch (err) {
      console.error("Save error:", err);
      setMessage("Failed to update profile. Please try again.");
      setMessageType('error');
      setIsSaving(false);
      // Optional: clear the error after a few seconds
      setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedClub(club); // Revert changes on cancel
    // Revert logo preview to the original club logo
    if (club && club.clogo) {
      setLogoPreview(club.clogo);
    } else {
      setLogoPreview(''); // Clear preview if no original logo
    }
    setLogoFile(null); // Clear file state
    setMessage(''); // Clear messages on cancel
    setMessageType('');
  };

  // Render Loading, Error, or Not Found states
  if (loading) {
    return (
      <div className="club-profile-container loading-page"> {/* Scoped class */}
        <div className="page-header">
           <h1 className="page-title">Club Profile</h1> {/* Title */}
        </div>
        <div className="profile-card loading-state"> {/* Scoped class */}
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="club-profile-container error-page"> {/* Scoped class */}
         <div className="page-header">
            <h1 className="page-title">Club Profile</h1> {/* Title */}
         </div>
         <div className="profile-card error-state"> {/* Scoped class */}
          <p>{message || "Club not found or failed to load."}</p> {/* Display message state */}
         </div>
      </div>
    );
  }

  // Main Profile View/Edit
  return (
    <div className="club-profile-container"> {/* Scoped class */}
      <div className="page-header">
         <h1 className="page-title">Club Profile</h1> {/* Title */}
      </div>

      <div className="profile-card"> {/* Scoped class */}
        {/* Message Display */}
        {message && (
          <div className={`profile-message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="profile-header">
          <div className="logo-section">
            {/* Display current logo or preview */}
            {logoPreview && (
              <img
                src={logoPreview} // Always use logoPreview state for display
                alt={`${club.cname || 'Club'} Logo`}
                className="club-logo"
              />
            )}
            {editMode && (
              <div className="logo-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  id="logo-upload-input"
                  className="logo-upload-input"
                />
                <label htmlFor="logo-upload-input" className="logo-upload-label">
                  <FaImage />
                </label>
              </div>
            )}
          </div>
          <div className="header-info">
            <h2 className="club-name">{club.cname}</h2> {/* Changed to h2 */}
            <p className="club-shortname"><FaTag className="icon" /> {club.cshortname}</p>
          </div>
        </div>

        <div className="profile-sections">
          {/* About Section */}
          <div className="profile-section about-section">
            <h3 className="section-title"><FaInfoCircle className="icon" /> About</h3>
            <div className="form-group">
              <label htmlFor="cdate"><FaCalendarAlt className="icon" /> Established:</label>
              <input
                id="cdate"
                type="date"
                name="cdate"
                value={editedClub.cdate?.slice(0, 10) || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="profile-input"
              />
            </div>
            <div className="form-group description-group">
              <label htmlFor="cdescription"><FaInfoCircle className="icon" /> Description:</label>
              <textarea
                id="cdescription"
                name="cdescription"
                value={editedClub.cdescription || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="profile-textarea"
                rows="4"
                placeholder="Tell us about your club..."
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="cachievement"><FaTrophy className="icon" /> Achievements:</label>
              <textarea
                id="cachievement"
                name="cachievement"
                value={editedClub.cachievement || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="profile-textarea"
                rows="3"
                placeholder="Highlight your club's accomplishments..."
              ></textarea>
            </div>
          </div>

          {/* Contact Section */}
          <div className="profile-section contact-section">
            <h3 className="section-title"><FaEnvelope className="icon" /> Contact Information</h3>
            <div className="form-group">
              <label htmlFor="caname"><FaUserTie className="icon" /> Advisor Name:</label>
              <input
                id="caname"
                name="caname"
                value={editedClub.caname || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="profile-input"
                placeholder="Enter advisor's name..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="cpname"><FaUsers className="icon" /> President Name:</label>
              <input
                id="cpname"
                name="cpname"
                value={editedClub.cpname || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="profile-input"
                placeholder="Enter president's name..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="cmail"><FaEnvelope className="icon" /> Email:</label>
              <input
                id="cmail"
                type="email"
                name="cmail"
                value={editedClub.cmail || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="profile-input"
                placeholder="Enter club email..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="cmobile"><FaPhone className="icon" /> Mobile:</label>
              <input
                id="cmobile"
                type="tel"
                name="cmobile"
                value={editedClub.cmobile || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="profile-input"
                placeholder="Enter club mobile number..."
              />
            </div>
            <div className="form-group">
               <label htmlFor="cpassword"><FaLock className="icon" /> Password:</label>
               <input
                 id="cpassword"
                 type="password"
                 name="cpassword"
                 value={editedClub.cpassword || ''}
                 onChange={handleChange}
                 disabled={!editMode}
                 className="profile-input"
                 placeholder={editMode ? "Enter new password (optional)" : "********"}
                 readOnly={!editMode && !editedClub.cpassword}
               />
             </div>
             <div className="form-group">
              <label htmlFor="csocial"><FaGlobe className="icon" /> Social Media:</label>
              <input
                id="csocial"
                name="csocial"
                value={editedClub.csocial || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="profile-input"
                placeholder="Enter social media link..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          {!editMode ? (
            <button className="profile-button edit-button" onClick={() => setEditMode(true)}>
              <FaEdit className="button-icon" /> Edit Profile
            </button>
          ) : (
            <>
              <button className="profile-button save-button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <FaSpinner className="button-icon spinner-icon" /> : <FaSave className="button-icon" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="profile-button cancel-button" onClick={handleCancelEdit} disabled={isSaving}>
                <FaTimesCircle className="button-icon" /> Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubProfile;
