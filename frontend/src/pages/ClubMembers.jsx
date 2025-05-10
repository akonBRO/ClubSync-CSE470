import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ClubMembersPage.module.css'; // Ensure this path is correct
import {
  Users,
  Search,
  ListChecks, // Page icon
  ShieldAlert,
  Loader2,
  UserCircle,
  Hash,
  GraduationCap,
  CalendarRange,
  Inbox,
  Mail,
  RefreshCcw, // For retry button
  Frown, // For no members
} from 'lucide-react';
import { debounce } from 'lodash'; // Import debounce

const ClubMembersPage = () => {
    const [members, setMembers] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const navigate = useNavigate();

    const fetchMembersApi = useCallback(async (query = '') => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3001/api/clubs/members?search=${query}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn("Unauthorized access to members page. Redirecting to login.");
                    navigate('/club-login'); // Ensure this route is correct for your app
                    return;
                }
                const errorData = await response.json().catch(() => ({ message: `Error fetching members: ${response.status}` }));
                throw new Error(errorData.message || `Error fetching members: ${response.status}`);
            }

            const data = await response.json();
            setMembers(data.members);
            setTotalCount(data.totalCount);
        } catch (err) {
            console.error('Failed to fetch members:', err);
            setError(err.message || 'Failed to load members. Please try again.');
        } finally {
            setLoading(false);
            if (isInitialLoad) setIsInitialLoad(false);
        }
    }, [navigate, isInitialLoad]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetchMembers = useCallback(
        debounce((query) => {
            setIsInitialLoad(false);
            fetchMembersApi(query);
        }, 400), // Debounce delay
        [fetchMembersApi]
    );

    useEffect(() => {
        if (isInitialLoad && !searchQuery) {
            fetchMembersApi();
        }
    }, [isInitialLoad, searchQuery, fetchMembersApi]);

    useEffect(() => {
        if (!isInitialLoad) {
            if (searchQuery.trim() === '' && members.length > 0) { // Or based on a flag if you want to clear table vs refetch all
                 debouncedFetchMembers(''); // Refetch all when search is cleared
            } else if (searchQuery.trim() !== '') {
                debouncedFetchMembers(searchQuery);
            }
        }
        return () => {
            debouncedFetchMembers.cancel();
        };
    }, [searchQuery, debouncedFetchMembers, isInitialLoad, members.length]);


    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    if (isInitialLoad && loading && !error) {
        return (
            <div className={`${styles.pageContainer} ${styles.stateFeedbackContainer}`}>
                <Loader2 className={styles.spinner} size={52} />
                <p className={styles.feedbackText}>Loading Club Members...</p>
            </div>
        );
    }

    if (error && isInitialLoad) {
        return (
            <div className={`${styles.pageContainer} ${styles.stateFeedbackContainer}`}>
                <ShieldAlert className={styles.errorIcon} size={52} />
                <h2 className={styles.feedbackTitle}>Oops! Something Went Wrong</h2>
                <p className={styles.feedbackText}>{error}</p>
                <button onClick={() => fetchMembersApi(searchQuery)} className={styles.primaryButton}>
                    <RefreshCcw size={18} className={styles.buttonIcon} /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <div className={styles.headerContent}>
                    <ListChecks size={40} className={styles.headerIcon} />
                    <div>
                        <h1 className={styles.pageTitle}>Club Member Directory</h1>
                        <p className={styles.pageSubtitle}>Browse, search, and manage your club's members.</p>
                    </div>
                </div>
            </header>

            <div className={styles.controlsSection}>
                <div className={styles.searchWrapper}>
                    <Search size={20} className={styles.searchInputIcon} />
                    <input
                        type="text"
                        placeholder="Search by Name, UID, Email, or Major..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.totalMembersInfo}>
                    <Users size={22} className={styles.infoIcon} />
                    <span>Total Members: <strong>{totalCount}</strong></span>
                </div>
            </div>

            {/* Inline error for subsequent load/search errors */}
            {error && !isInitialLoad && (
                <div className={`${styles.inlineAlert} ${styles.errorAlert}`}>
                    <ShieldAlert size={22} />
                    <span>{error}</span>
                    <button onClick={() => fetchMembersApi(searchQuery)} className={styles.alertRetryButton}>
                        <RefreshCcw size={16} /> Retry
                    </button>
                </div>
            )}

            {/* Loading indicator for subsequent searches */}
            {loading && !isInitialLoad && (
                 <div className={`${styles.inlineAlert} ${styles.loadingAlert}`}>
                    <Loader2 className={styles.inlineSpinner} size={22}/>
                    <span>Searching members...</span>
                </div>
            )}

            {!loading && members.length === 0 && !error ? (
                <div className={styles.noResultsContainer}>
                    <Frown size={50} className={styles.noResultsIcon} />
                    <p className={styles.noResultsText}>
                        {searchQuery ? 'No members found matching your search criteria.' : 'No members have been added to this club yet.'}
                    </p>
                </div>
            ) : (
                members.length > 0 && (
                    <div className={styles.tableWrapper}>
                        <table className={styles.membersTable}>
                            <thead>
                                <tr>
                                    <th><Hash size={16} className={styles.tableHeaderIcon}/>UID</th>
                                    <th><UserCircle size={16} className={styles.tableHeaderIcon}/>Name</th>
                                    <th><Mail size={16} className={styles.tableHeaderIcon}/>Email</th>
                                    <th><GraduationCap size={16} className={styles.tableHeaderIcon}/>Major</th>
                                    <th><CalendarRange size={16} className={styles.tableHeaderIcon}/>Semester Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(member => (
                                    <tr key={member.uid || member._id}> {/* Use _id as fallback if uid isn't always present */}
                                        <td data-label="UID:">{member.uid}</td>
                                        <td data-label="Name:">{member.uname}</td>
                                        <td data-label="Email:">{member.umail || 'N/A'}</td>
                                        <td data-label="Major:">{member.major || 'N/A'}</td>
                                        <td data-label="Semester:">{member.semester || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
};

export default ClubMembersPage;