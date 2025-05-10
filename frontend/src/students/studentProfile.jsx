import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FaEdit, FaSave, FaEnvelope, FaPhone, FaLock, FaInfoCircle,
  FaCalendarAlt, FaUser, FaTag, FaSpinner, FaTimesCircle,
  FaGraduationCap, FaBook, FaVenusMars, FaSignOutAlt, FaIdCardAlt,
  FaChevronDown // For custom select arrow if needed
} from 'react-icons/fa'; // Import icons
import './StudentProfile.css'; // Import the CSS file

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [editedStudent, setEditedStudent] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(''); // State for success/error messages
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [isSaving, setIsSaving] = useState(false); // State for save button loading
  const [isLoggingOut, setIsLoggingOut] = useState(false); // State for logout button loading

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentProfile = async () => {
      setLoading(true);
      setMessage(''); // Clear previous messages
      setMessageType('');
      try {
        // Check session first
        const authCheck = await axios.get('http://localhost:3001/api/students/check-auth', {
          withCredentials: true
        });

        if (!authCheck.data.isLoggedIn) {
          setMessage("Authentication failed. Please log in.");
          setMessageType('error');
          setTimeout(() => navigate('/login-student'), 2000);
          setLoading(false);
          return;
        }

        // Get student data using session info (assuming _id is returned)
        const studentId = authCheck.data.student._id;
        const response = await axios.get(`http://localhost:3001/api/students/${studentId}`, {
          withCredentials: true
        });

        setStudent(response.data);
        setEditedStudent(response.data);
        setLoading(false);

      } catch (err) {
        console.error("Error fetching student data:", err);
        setMessage("Failed to load student data. Please try again.");
        setMessageType('error');
        setLoading(false);
        if (err.response?.status === 401 || err.response?.status === 403) {
           // If unauthorized or forbidden, redirect to login
          setTimeout(() => navigate('/login-student'), 2000);
        }
         // Optional: clear the message after a few seconds
        setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
      }
    };

    fetchStudentProfile();
  }, [navigate]); // navigate is a stable dependency

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedStudent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true); // Show loading during save
    setMessage(''); // Clear previous messages
    setMessageType('');

    try {
      // Create update payload excluding restricted fields
      // Assuming uname, uid, clubs, pen_clubs should NOT be editable by the student
      const { uname, uid, clubs, pen_clubs, _id, __v, ...updateData } = editedStudent;

      const response = await axios.put(
        `http://localhost:3001/api/students/${student._id}/update`,
        updateData,
        { withCredentials: true }
      );

      setStudent(response.data);
      setEditedStudent(response.data); // Update edited state with fresh data
      setEditMode(false);
      setIsSaving(false);
      setMessage("Profile updated successfully!");
      setMessageType('success');
      // Optional: clear the message after a few seconds
      setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);

    } catch (err) {
      console.error("Update error:", err);
      setMessage("Failed to update profile. Please try again.");
      setMessageType('error');
      setIsSaving(false);
      // Optional: clear the error after a few seconds
      setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedStudent(student); // Revert changes on cancel
    setMessage(''); // Clear messages on cancel
    setMessageType('');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true); // Show loading during logout
    try {
      await axios.post('http://localhost:3001/api/students/logout', {}, {
        withCredentials: true
      });
      // Clear any local storage items related to student session if necessary
      // localStorage.removeItem('studentToken'); // Example
      navigate('/login-student');
    } catch (err) {
      console.error("Logout error:", err);
      setMessage("Failed to log out.");
      setMessageType('error');
      setIsLoggingOut(false);
       // Optional: clear the message after a few seconds
      setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);
    }
  };

  // Render Loading or Error states
  if (loading) {
    return (
      <div className="student-profile-container loading-page"> {/* Scoped class */}
        <h1 className="page-title"><FaUser className="icon" /> Student Profile</h1> {/* Title with icon */}
        <div className="profile-card loading-state"> {/* Scoped class */}
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-profile-container error-page"> {/* Scoped class */}
         <h1 className="page-title"><FaUser className="icon" /> Student Profile</h1> {/* Title with icon */}
         <div className="profile-card error-state"> {/* Scoped class */}
          <p>{message || "Student data could not be loaded."}</p> {/* Display message state */}
         </div>
      </div>
    );
  }

  // Main Profile View/Edit
  return (
    <div className="student-profile-container"> {/* Scoped class */}

      <div className="page-header-area"> {/* New div for title and logout */}
         <h1 className="page-title"><FaUser className="icon" /> Student Profile</h1> {/* Title with icon */}
         
      </div>


      <div className="profile-card"> {/* Scoped class */}
        {/* Message Display */}
        {message && (
          <div className={`global-message ${messageType}`}> {/* Using global-message class from reference */}
             {messageType === 'error' ? <FaTimesCircle className="message-icon" /> : <FaInfoCircle className="message-icon" />}
            {message}
          </div>
        )}

        <div className="profile-sections">
          {/* Personal Information Section */}
          <div className="profile-section personal-info-section">
            <h3 className="section-title"><FaUser className="icon" /> Personal Information</h3>

            <div className="form-group read-only">
              <label htmlFor="uid"><FaIdCardAlt className="icon" /> Student ID:</label>
              <input
                id="uid"
                type="text"
                value={student.uid || ''}
                readOnly
                className="profile-input read-only-field"
              />
            </div>

            <div className="form-group read-only">
              <label htmlFor="uname"><FaUser className="icon" /> Name:</label>
              <input
                id="uname"
                type="text"
                value={student.uname || ''}
                readOnly
                className="profile-input read-only-field"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dob"><FaCalendarAlt className="icon" /> Date of Birth:</label>
              {editMode ? (
                <input
                  id="dob"
                  type="date"
                  name="dob"
                  value={editedStudent.dob ? editedStudent.dob.split('T')[0] : ''} // Format date for input
                  onChange={handleChange}
                  className="profile-input"
                />
              ) : (
                <span className="profile-value">{student.dob ? new Date(student.dob).toLocaleDateString() : 'Not specified'}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="ugender"><FaVenusMars className="icon" /> Gender:</label>
              {editMode ? (
                <div className="input-icon-wrapper"> {/* Wrapper for select and potential icon */}
                  <select
                    id="ugender"
                    name="ugender"
                    value={editedStudent.ugender || ''}
                    onChange={handleChange}
                    className="profile-input profile-select"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                   {/* Optional: Add a custom arrow icon if needed */}
                  {/* <FaChevronDown className="input-icon" /> */}
                </div>
              ) : (
                <span className="profile-value">{student.ugender || 'Not specified'}</span>
              )}
            </div>
          </div>

          {/* Contact and Academic Information Section */}
          <div className="profile-section contact-academic-section">
             <h3 className="section-title"><FaInfoCircle className="icon" /> Contact & Academic</h3>

            <div className="form-group">
              <label htmlFor="umail"><FaEnvelope className="icon" /> Email:</label>
              {editMode ? (
                <input
                  id="umail"
                  type="email"
                  name="umail"
                  value={editedStudent.umail || ''}
                  onChange={handleChange}
                  className="profile-input"
                  placeholder="Enter your email..."
                />
              ) : (
                <span className="profile-value">{student.umail || 'Not specified'}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="umobile"><FaPhone className="icon" /> Mobile:</label>
              {editMode ? (
                <input
                  id="umobile"
                  type="tel"
                  name="umobile"
                  value={editedStudent.umobile || ''}
                  onChange={handleChange}
                  className="profile-input"
                  placeholder="Enter your mobile number..."
                />
              ) : (
                <span className="profile-value">{student.umobile || 'Not specified'}</span>
              )}
            </div>

             {/* Password field - Consider a separate "Change Password" flow */}
             <div className="form-group">
               <label htmlFor="upassword"><FaLock className="icon" /> Password:</label>
               {editMode ? (
                 <input
                   id="upassword"
                   type="password"
                   name="upassword"
                   value={editedStudent.upassword || ''} // Display value only if editing? Or just a placeholder?
                   onChange={handleChange}
                   className="profile-input"
                   placeholder="Enter new password (optional)"
                 />
               ) : (
                 <span className="profile-value">********</span> // Never display actual password
               )}
             </div>

            <div className="form-group">
              <label htmlFor="major"><FaGraduationCap className="icon" /> Major:</label>
              {editMode ? (
                <input
                  id="major"
                  type="text"
                  name="major"
                  value={editedStudent.major || ''}
                  onChange={handleChange}
                  className="profile-input"
                  placeholder="Enter your major..."
                />
              ) : (
                <span className="profile-value">{student.major || 'Not specified'}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="semester"><FaBook className="icon" /> Semester:</label>
              {editMode ? (
                <input
                  id="semester"
                  type="text" // Or number if applicable
                  name="semester"
                  value={editedStudent.semester || ''}
                  onChange={handleChange}
                  className="profile-input"
                  placeholder="Enter your current semester..."
                />
              ) : (
                <span className="profile-value">{student.semester || 'Not specified'}</span>
              )}
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

export default StudentProfile;
