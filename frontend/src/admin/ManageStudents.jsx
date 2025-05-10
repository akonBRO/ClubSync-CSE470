import React, { useState, useEffect } from 'react';
import styles from './ManageStudents.module.css';
import {
FaSearch,
FaFilter,
FaEdit,
FaSpinner,
FaUsers,
FaBook,
FaSyncAlt,
FaSave,
FaTimes, // Icon for cancel
FaExclamationCircle, // Icon for error
FaInfoCircle, // Icon for empty state
FaGraduationCap, // Icon for total students
FaRegBuilding // Icon for major filter
} from 'react-icons/fa';
import StudentClubsModal from './StudentClubsModal'; // Create this component
import axios from 'axios';

const ManageStudents = () => {
const [students, setStudents] = useState([]);
const [filteredStudents, setFilteredStudents] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [selectedMajor, setSelectedMajor] = useState('All Majors');
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [totalStudentCount, setTotalStudentCount] = useState(0);
const [majors, setMajors] = useState(['All Majors']);

// State for inline editing
const [editingStudentId, setEditingStudentId] = useState(null);
const [editedStudent, setEditedStudent] = useState({});
const [isSaving, setIsSaving] = useState(false); // Dedicated saving state for button spinner

// State for the "Show Clubs" modal
const [isClubsModalOpen, setIsClubsModalOpen] = useState(false);
const [studentClubNames, setStudentClubNames] = useState([]);
const [clubModalLoading, setClubModalLoading] = useState(false);
const [clubModalError, setClubModalError] = useState('');

// --- Initial Load Effect ---
useEffect(() => {
    fetchTotalStudentCount();
    fetchMajors();
    fetchStudents(); // Fetch students on initial mount
}, []); // Empty dependency array means this runs once on mount

// --- Fetch Students when Major Filter Changes ---
useEffect(() => {
    // Only re-fetch if majors list has been loaded and selectedMajor is not the initial 'All Majors' state
    // to avoid double fetching on initial mount. Or simply ensure fetchStudents handles the 'All Majors' case.
        if (majors.length > 1 || selectedMajor === 'All Majors') { // Crude check if majors are likely loaded
            console.log("Fetching students due to major filter change:", selectedMajor);
            fetchStudents();
        }
}, [selectedMajor, majors.length]); // Depend on selectedMajor and ensure majors are loaded

// --- Apply Search Filter Locally ---
useEffect(() => {
    console.log("Applying local search filter. Search term:", searchTerm);
    applySearchFilter();
}, [students, searchTerm]); // Re-filter whenever students list or search term changes


const fetchTotalStudentCount = async () => {
    try {
        const response = await axios.get('http://localhost:3001/api/admins/students/count', {
            withCredentials: true
        });
        setTotalStudentCount(response.data.totalCount);
    } catch (err) {
        console.error('Error fetching total student count:', err);
        // Decide how to handle this error - maybe show a message or leave count as 0
    }
};

const fetchMajors = async () => {
    try {
        const response = await axios.get('http://localhost:3001/api/admins/students/majors', {
            withCredentials: true
        });
        const uniqueMajors = ['All Majors', ...response.data];
        setMajors(uniqueMajors);
        console.log("Fetched unique majors for filter:", uniqueMajors);
    } catch (err) {
        console.error('Error fetching majors:', err);
        setError('Failed to load majors for filter.'); // Use the main error state for this if critical
        setMajors(['All Majors']);
    }
};

const fetchStudents = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
        const params = new URLSearchParams();
        if (selectedMajor !== 'All Majors') {
            params.append('major', selectedMajor);
        }

        console.log("Fetching students from backend with params:", params.toString());

        const response = await axios.get('http://localhost:3001/api/admins/students', {
            params: params,
            withCredentials: true
        });
        setStudents(response.data); // Update main students list
        // The effect depending on 'students' will handle applying the current search term
        setLoading(false);
    } catch (err) {
        console.error('Error fetching students:', err);
        setError(err.response?.data?.message || 'Failed to fetch students.');
        setStudents([]); // Clear students on fetch error
        setLoading(false);
    }
};


const applySearchFilter = () => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = students.filter(student => {
        const matchesSearch =
                (student.uname ? student.uname.toLowerCase().includes(lowerCaseSearchTerm) : false) ||
                (student.uid ? String(student.uid).includes(lowerCaseSearchTerm) : false) ||
                (student.umail ? student.umail.toLowerCase().includes(lowerCaseSearchTerm) : false) ||
                (student.major ? student.major.toLowerCase().includes(lowerCaseSearchTerm) : false) ||
                (student.umobile ? student.umobile.includes(lowerCaseSearchTerm) : false); // Match mobile number directly


        return matchesSearch;
    });
    setFilteredStudents(filtered);
};


    const startEditing = (student) => {
        setEditingStudentId(student._id);
        // Copy all relevant student data to editedStudent state
        setEditedStudent({ ...student });
    };

    const cancelEditing = () => {
        setEditingStudentId(null);
        setEditedStudent({});
        setError(''); // Clear any edit-related error
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditedStudent(prev => ({ ...prev, [name]: value }));
    };

    const saveStudent = async (studentId) => {
        setIsSaving(true); // Show saving state
        setError(''); // Clear previous errors

        // Check if the student data for this row is actually in editedStudent
        if (!editedStudent || editedStudent._id !== studentId) {
            console.error("Save triggered but editedStudent state doesn't match current student ID");
            setError("Error: Mismatch in editing state. Please try again.");
            setIsSaving(false);
            return;
        }

        try {
            // Prepare payload - send only potentially changed fields
            const originalStudent = students.find(s => s._id === studentId);
            const updatePayload = {};
            let isChanged = false;

            // Compare fields to build payload and check if anything changed
            const editableFields = ['uname', 'major', 'umobile', 'dob']; // Define editable fields
            editableFields.forEach(field => {
                if (editedStudent[field] !== originalStudent[field]) {
                    updatePayload[field] = editedStudent[field];
                    isChanged = true;
                }
            });

            if (!isChanged) {
                console.log("No changes detected for student", studentId);
                cancelEditing(); // Just exit editing if no changes
                setIsSaving(false);
                return;
            }


            console.log('Saving student', studentId, 'with payload:', updatePayload);

            const response = await axios.put(`http://localhost:3001/api/admins/students/${studentId}`, updatePayload, {
                withCredentials: true
            });

            console.log('Student updated successfully:', response.data.student);

            // Update the student list with the returned updated student
            setStudents(students.map(s => s._id === studentId ? response.data.student : s));
            // applySearchFilter will be triggered by the 'students' state change effect

            setIsSaving(false);
            setEditingStudentId(null); // Exit editing mode
            setEditedStudent({}); // Clear edited state


        } catch (err) {
            console.error('Error saving student:', err);
            setError(err.response?.data?.message || 'Failed to save student changes.');
            setIsSaving(false);
            // Keep editing mode open to allow user to fix/cancel
        }
    };


    const openClubsModal = async (studentId) => {
         setClubModalLoading(true);
        setClubModalError('');
       setStudentClubNames([]);
        
       try {
      const response = await axios.get(`http://localhost:3001/api/admins/students/${studentId}/clubs`, {
       withCredentials: true
       });
       // Backend returns an array of strings (club names)
       // FIX: Use response.data directly as it's already an array of names
     setStudentClubNames(response.data); // <--- Change this line
       setClubModalLoading(false);
       setIsClubsModalOpen(true);
        } catch (err) {
     console.error('Error fetching student clubs:', err);
      setClubModalError(err.response?.data?.message || 'Failed to fetch student clubs.');
      setClubModalLoading(false);
      setIsClubsModalOpen(true); // Still open modal to show error
         }
        };

    const closeClubsModal = () => {
        setIsClubsModalOpen(false);
        setStudentClubNames([]);
        setClubModalError('');
    };


return (
    <div className={styles.manageStudentsPage}>
        <div className={styles.pageHeader}>
            <h1>Manage Students</h1>
            <p>View and manage student information and their club memberships.</p>
        </div>

            {/* Status Count Section (Total Students) */}
            <section className={styles.statusCountsSection}>
                <div className={styles.statusCard}>
                    <div className={`${styles.countIcon} ${styles.countIconStudents}`}>
                        <FaGraduationCap />
                    </div>
                    <div className={styles.countDetails}>
                        <span>Total Students</span>
                        <strong>{totalStudentCount}</strong>
                    </div>
                </div>
                {/* Could add more status cards here if needed, e.g., Active Members, Students in 2+ Clubs etc. */}
            </section>


            {/* Controls Section */}
            <section className={styles.controlsSection}>
                <div className={styles.searchBarWrapper}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by ID, Name, Email, or Mobile"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filtersWrapper}>
                    <div className={styles.filterGroup}>
                        <FaRegBuilding className={styles.filterIcon}/> {/* Icon for Major filter */}
                        <select
                            id="majorFilter"
                            value={selectedMajor}
                            onChange={(e) => setSelectedMajor(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {majors.map(major => (
                                <option key={major} value={major}>{major}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={fetchStudents} className={styles.refreshButton}>
                        <FaSyncAlt /> Refresh Data
                    </button>
                </div>
            </section>


            {/* Loading, Error, Empty States */}
            {loading && (
                <div className={styles.loadingState}>
                    <FaSpinner className={styles.spinnerIcon} />
                    <p>Loading students...</p>
                </div>
            )}

            {!loading && error && (
                <div className={styles.errorMessage}>
                    <FaExclamationCircle />
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && filteredStudents.length === 0 && (
                <div className={styles.emptyState}>
                    <FaInfoCircle className={styles.emptyIcon} />
                    <p>No students found.</p>
                    <p>Adjust your filters or search term.</p>
                </div>
            )}

            {/* Students Table Section */}
            {!loading && !error && filteredStudents.length > 0 && (
                <section className={styles.studentsTableSection}>
                    <div className={styles.studentsTableContainer}>
                        <table className={styles.studentsTable}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Mobile</th>
                                    <th>Major</th>
                                    <th>DOB</th>
                                    <th>Semester</th>
                                    <th>Clubs</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => (
                                    <tr key={student._id} className={styles.studentRow}>
                                        <td>{student.uid}</td>
                                        <td className={styles.editableCell}> {/* Add class for editable cells */}
                                            {editingStudentId === student._id ? (
                                                <input
                                                    type="text"
                                                    name="uname"
                                                    value={editedStudent.uname || ''}
                                                    onChange={handleEditInputChange}
                                                    className={styles.editInput}
                                                />
                                            ) : (
                                                student.uname
                                            )}
                                        </td>
                                        <td>{student.umail}</td>
                                        <td className={styles.editableCell}>
                                            {editingStudentId === student._id ? (
                                                <input
                                                    type="text"
                                                    name="umobile"
                                                    value={editedStudent.umobile || ''}
                                                    onChange={handleEditInputChange}
                                                    className={styles.editInput}
                                                />
                                            ) : (
                                                student.umobile
                                            )}
                                        </td>
                                        <td className={styles.editableCell}>
                                            {editingStudentId === student._id ? (
                                                // Assuming major could be a dropdown of available majors if needed
                                                <input
                                                    type="text" // Or type="select" if using a dropdown
                                                    name="major"
                                                    value={editedStudent.major || ''}
                                                    onChange={handleEditInputChange}
                                                    className={styles.editInput}
                                                />
                                            ) : (
                                                student.major
                                            )}
                                        </td>
                                        <td className={styles.editableCell}>
                                            {editingStudentId === student._id ? (
                                                <input
                                                    type="date" // Use date type for DOB input
                                                    name="dob"
                                                    value={editedStudent.dob ? editedStudent.dob.substring(0, 10) : ''} // Format date for input
                                                    onChange={handleEditInputChange}
                                                    className={styles.editInput}
                                                />
                                            ) : (
                                                // Format DOB for display
                                                student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'
                                            )}
                                        </td>
                                        <td>{student.semester}</td>
                                        <td>
                                            <button
                                                onClick={() => openClubsModal(student._id)}
                                                className={styles.showClubsButton}
                                                disabled={clubModalLoading}
                                            >
                                                {clubModalLoading ? <FaSpinner className={styles.loadingSpinner} /> : <FaBook />}
                                                Clubs ({Array.isArray(student.clubs) ? student.clubs.length : 0})
                                            </button>
                                        </td>
                                        <td className={styles.actionsCell}>
                                            {editingStudentId === student._id ? (
                                                <>
                                                    <button onClick={() => saveStudent(student._id)} className={styles.saveButton} disabled={isSaving}>
                                                        {isSaving ? <FaSpinner className={styles.loadingSpinner} /> : <FaSave />}
                                                        {isSaving ? '' : ' Save'}
                                                    </button>
                                                    <button onClick={cancelEditing} className={styles.cancelButton} disabled={isSaving}>
                                                        <FaTimes /> Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => startEditing(student)} className={styles.editButton} disabled={isSaving || loading}>
                                                    <FaEdit /> Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Student Clubs Modal */}
            {isClubsModalOpen && (
                <StudentClubsModal
                    clubNames={studentClubNames}
                    loading={clubModalLoading}
                    error={clubModalError}
                    onClose={closeClubsModal}
                />
            )}
        </div>
    );
};

export default ManageStudents;