import React, { useState, useEffect } from 'react';
import styles from './ManageClubs.module.css';
import { FaSearch, FaFilter,FaUniversity,FaClub, FaEdit, FaUsers, FaSyncAlt, FaSave, FaExternalLinkAlt, FaSpinner, FaIdCard, FaHashtag, FaEnvelope, FaPhone, FaCalendarAlt, FaAlignLeft, FaStar, FaLink, FaGlobe, FaUserFriends, FaRecycle } from 'react-icons/fa'; // More specific icons
import axios from 'axios';

const ManageClubs = () => {
// --- State Declarations ---
const [clubs, setClubs] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [selectedRecruitingStatus, setSelectedRecruitingStatus] = useState('All');
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [totalClubCount, setTotalClubCount] = useState(0);

// State for inline editing
const [editingClubId, setEditingClubId] = useState(null);
const [editedClub, setEditedClub] = useState({});

// Options for the recruiting status filter
const recruitingStatusOptions = ['All', 'Recruiting', 'Not Recruiting'];

// --- Function Definitions ---

const fetchTotalClubCount = async () => {
    try {
        const response = await axios.get('http://localhost:3001/api/admins/clubs/count', {
            withCredentials: true
        });
        setTotalClubCount(response.data.totalCount);
    } catch (err) {
        console.error('Error fetching total club count:', err);
        // Handle error fetching count if needed
    }
};

const fetchClubs = async () => {
    setLoading(true);
    setError('');
    try {
        const params = new URLSearchParams();
        if (selectedRecruitingStatus !== 'All') {
            params.append('recruitingStatus', selectedRecruitingStatus);
        }
            if (searchTerm) {
                params.append('search', searchTerm);
            }

        console.log("Fetching clubs from backend with params:", params.toString());

        const response = await axios.get('http://localhost:3001/api/admins/clubs', {
                params: params,
                withCredentials: true
        });
        setClubs(response.data);
        setLoading(false);
    } catch (err) {
        console.error('Error fetching clubs:', err);
            setError(err.response?.data?.message || 'Failed to fetch clubs.');
        setLoading(false);
    }
};


    const startEditing = (club) => {
        setEditingClubId(club._id);
        // Copy only the specified editable fields
        setEditedClub({
            _id: club._id, // Keep _id
            cname: club.cname,
            cshortname: club.cshortname,
            cmail: club.cmail,
            cmobile: club.cmobile,
            cdescription: club.cdescription,
            // Format Date object to ISO string YYYY-MM-DD for input type="date"
            cdate: club.cdate ? new Date(club.cdate).toISOString().split('T')[0] : '',
        });
    };

    const cancelEditing = () => {
        setEditingClubId(null);
        setEditedClub({});
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditedClub(prev => ({ ...prev, [name]: value }));
    };

    const saveClub = async (clubId) => {
        setLoading(true); // Show loading while saving
        setError('');
        try {
            // Send only the editable fields from editedClub
            const updatePayload = {
                cname: editedClub.cname,
                cshortname: editedClub.cshortname,
                cmail: editedClub.cmail,
                // Ensure cmobile is sent as a number if backend expects it
                cmobile: editedClub.cmobile ? Number(editedClub.cmobile) : null,
                cdescription: editedClub.cdescription,
                cdate: editedClub.cdate, // Send the YYYY-MM-DD string, backend parses to Date
            };

            const response = await axios.put(`http://localhost:3001/api/admins/clubs/${clubId}`, updatePayload, {
                withCredentials: true
            });

            console.log('Club updated successfully:', response.data.club);
            fetchClubs(); // Re-fetch after saving to get the updated data

            setLoading(false);
            setEditingClubId(null); // Exit editing mode
            setEditedClub({}); // Clear edited state

        } catch (err) {
            console.error('Error saving club:', err);
            setError(err.response?.data?.message || 'Failed to save club changes.');
            setLoading(false);
            fetchClubs(); // Re-fetch to get correct state if save failed
        }
    };


// --- useEffect Hooks ---

useEffect(() => {
    fetchTotalClubCount();
}, []); // Fetch total count once on mount

useEffect(() => {
    console.log("Fetching clubs with filter and search. Status:", selectedRecruitingStatus, "Search:", searchTerm);
    fetchClubs();
}, [selectedRecruitingStatus, searchTerm]);


// --- Render Logic ---
return (
    <div className={styles.manageClubsContainer}>
        <h2>Manage Clubs</h2>

            {/* Total Club Count */}
            
            <section className={styles.statusCountsSection}>
                            <div className={styles.statusCard}>
                                <div className={`${styles.countIcon} ${styles.countIconClubs}`}>
                                    <FaUniversity />
                                </div>
                                <div className={styles.countDetails}>
                                    <span>Total Clubs</span>
                                    
                                    <strong>{totalClubCount}</strong>
                                </div>
                            </div>
                            {/* Could add more status cards here if needed, e.g., Active Members, Students in 2+ Clubs etc. */}
                        </section>
            {/* Search and Filter Section */}
        <div className={styles.controls}>
            <div className={styles.searchBar}>
                <FaSearch className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search by ID or Name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                        <label htmlFor="recruitingFilter">Recruiting Status:</label>
                    <select
                        id="recruitingFilter"
                        value={selectedRecruitingStatus}
                        onChange={(e) => setSelectedRecruitingStatus(e.target.value)}
                        className={styles.filterSelect}
                    >
                            {recruitingStatusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                    </select>
                </div>
                    {/* Optional: Add a refresh button */}
                <button onClick={fetchClubs} className={styles.refreshButton} disabled={loading}>
                        <FaSyncAlt className={loading ? styles.loadingSpinner : ''} /> Refresh
                </button>
            </div>
        </div>


        {loading && <p>Loading clubs...</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}

        {!loading && !error && clubs.length === 0 && (
                <p>No clubs found matching the criteria.</p>
        )}

        {/* Clubs Grid */}
        {!loading && !error && clubs.length > 0 && (
            <div className={styles.clubsGrid}> {/* Use a div for the grid container */}
                {clubs.map(club => (
                    <div key={club._id} className={styles.clubCard}> {/* Each club is a card/grid item */}
                        <div className={styles.cardHeader}>
                            {/* Club Name (Editable) */}
                            <div className={styles.clubName}>
                                {editingClubId === club._id ? (
                                    <input
                                        type="text"
                                        name="cname"
                                        value={editedClub.cname || ''}
                                        onChange={handleEditInputChange}
                                        className={styles.editInput}
                                    />
                                ) : (
                                        club.cname
                                )}
                            </div>
                            {/* CID (Not Editable) */}
                            <div className={styles.clubId}>
                                    <FaIdCard className={styles.inlineIcon} /> CID: {club.cid}
                            </div>
                        </div>

                            {/* Editable Fields */}
                            <div className={styles.cardEditableInfo}>
                                <div className={styles.infoRow}>
                                    <FaHashtag className={styles.inlineIcon} />
                                    <label>Short Name:</label>
                                    {editingClubId === club._id ? (
                                            <input
                                                type="text"
                                                name="cshortname"
                                                value={editedClub.cshortname || ''}
                                                onChange={handleEditInputChange}
                                                className={styles.editInput}
                                            />
                                        ) : (
                                            club.cshortname
                                        )}
                                </div>
                                <div className={styles.infoRow}>
                                    <FaEnvelope className={styles.inlineIcon} />
                                    <label>Email:</label>
                                    {editingClubId === club._id ? (
                                            <input
                                                type="text"
                                                name="cmail"
                                                value={editedClub.cmail || ''}
                                                onChange={handleEditInputChange}
                                                className={styles.editInput}
                                            />
                                        ) : (
                                            club.cmail
                                        )}
                                </div>
                                <div className={styles.infoRow}>
                                    <FaPhone className={styles.inlineIcon} />
                                    <label>Mobile:</label>
                                    {editingClubId === club._id ? (
                                            <input
                                                type="text"
                                                name="cmobile"
                                                value={editedClub.cmobile || ''}
                                                onChange={handleEditInputChange}
                                                className={styles.editInput}
                                            />
                                        ) : (
                                            club.cmobile
                                        )}
                                </div>
                                <div className={styles.infoRow}>
                                    <FaCalendarAlt className={styles.inlineIcon} />
                                    <label>Created:</label>
                                    {editingClubId === club._id ? (
                                            <input
                                                type="date"
                                                name="cdate"
                                                value={editedClub.cdate || ''}
                                                onChange={handleEditInputChange}
                                                className={styles.editInput}
                                            />
                                        ) : (
                                            club.cdate ? new Date(club.cdate).toLocaleDateString() : 'N/A'
                                        )}
                                </div>
                                <div className={styles.infoRowFull}> {/* Row for multiline text */}
                                    <FaAlignLeft className={styles.inlineIconTop} /> {/* Align icon to top */}
                                    <label>Description:</label>
                                    {editingClubId === club._id ? (
                                            <textarea
                                                name="cdescription"
                                                value={editedClub.cdescription || ''}
                                                onChange={handleEditInputChange}
                                                className={styles.editTextarea}
                                                rows="4"
                                            />
                                        ) : (
                                            <div className={styles.longTextDisplay}>{club.cdescription}</div>
                                        )}
                                </div>
                            </div>


                            {/* Non-Editable / Other Info Fields */}
                        <div className={styles.cardOtherInfo}>
                                <div className={styles.infoRow}>
                                    <FaIdCard className={styles.inlineIcon} /> Advisor: {club.caname}
                                </div>
                                <div className={styles.infoRow}>
                                    <FaUsers className={styles.inlineIcon} /> President: {club.cpname}
                                </div>
                                <div className={styles.infoRow}>
                                    <FaUserFriends className={styles.inlineIcon} /> Members: {Array.isArray(club.cmembers) ? club.cmembers.length : 0}
                                </div>
                                <div className={styles.infoRow}>
                                    <FaRecycle className={styles.inlineIcon} /> Recruiting:
                                    {club.hasOwnProperty('isRecruiting') ? (
                                        club.isRecruiting ? (
                                            <span className={styles.recruitingStatusTrue}>Yes</span>
                                        ) : (
                                            <span className={styles.recruitingStatusFalse}>No</span>
                                        )
                                    ) : ( 'N/A' )}
                                </div>
                                <div className={styles.infoRowFull}>
                                    <FaStar className={styles.inlineIconTop} />
                                    <label>Achievement:</label>
                                    <div className={styles.longTextDisplay}>{club.cachievement}</div>
                                </div>
                                <div className={styles.infoRowFull}>
                                        <FaLink className={styles.inlineIconTop} />
                                    <label>Logo URL:</label>
                                    <div className={styles.longTextDisplay}>
                                            {club.clogo ? <a href={club.clogo} target="_blank" rel="noopener noreferrer">{club.clogo}</a> : 'N/A'}
                                        </div>
                                </div>
                                    <div className={styles.infoRowFull}>
                                        <FaGlobe className={styles.inlineIconTop} />
                                    <label>Social Links:</label>
                                        <div className={styles.longTextDisplay}>{club.csocial}</div> {/* Display as text for now */}
                                </div>
                        </div>


                            {/* Actions */}
                        <div className={styles.cardActions}>
                            {editingClubId === club._id ? (
                                <>
                                    {/* Save Button */}
                                    <button onClick={() => saveClub(club._id)} className={styles.saveButton} disabled={loading}>
                                        {loading ? <FaSpinner className={styles.loadingSpinner} /> : <FaSave />}
                                        {loading ? ' Saving...' : ' Save'}
                                    </button>
                                    {/* Cancel Button */}
                                    <button onClick={cancelEditing} className={styles.cancelButton} disabled={loading}>
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                    /* Edit Button */
                                <button onClick={() => startEditing(club)} className={styles.editButton}>
                                    <FaEdit /> Edit
                                </button>
                            )}
                        </div>

                    </div>
                ))}
            </div>
        )}
    </div>
);
};

export default ManageClubs;