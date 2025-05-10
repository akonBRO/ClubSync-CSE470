import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link for navigation
import styles from './ClubLogin.module.css'; // Using CSS Modules
import { LockKeyhole, User, KeyRound } from 'lucide-react'; // Importing more icons

const ClubLogin = () => {
    const [cid, setCid] = useState('');
    const [cpassword, setCpassword] = useState('');
    const [error, setError] = useState(''); // State for error message
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        console.log('Sending CID:', cid, 'Password:', cpassword);

        // Simple validation (optional, server should also validate)
        if (!cid || !cpassword) {
            setError('Please enter both Club ID and Password.');
            return;
        }

        try {
            const res = await fetch('http://localhost:3001/api/clubs/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cid, cpassword }),
                credentials: 'include' // Include cookies for session handling
            });

            const data = await res.json();

            if (res.ok) {
                // Login successful
                // alert('Login Successful'); // Consider a more modern notification
                console.log('Login successful:', data.message);

                localStorage.setItem('cid', cid);
                // Assuming data.club.cname exists on successful login response
                if (data.club && data.club.cname) {
                     localStorage.setItem('clubName', data.club.cname);
                     console.log('Club Name stored:', data.club.cname);
                } else {
                     console.warn('Club name not received in login response.');
                     localStorage.removeItem('clubName'); // Ensure no stale data if expected
                }

                console.log('Attempting to navigate to /club/overview');
                navigate('/club/overview');

            } else {
                // Login failed based on server response
                const errorMessage = data.message || 'Login failed. Please check your credentials.';
                setError(errorMessage);
                console.error('Login failed:', errorMessage);
            }
        } catch (error) {
            // Network or other unexpected errors
            console.error('Login error:', error);
            setError('An error occurred. Please try again later.'); // Generic user-friendly error
        }
    };

    return (
        <div className={styles.loginPageWrapper}> {/* Wrapper for background effect */}

             {/* Background Thematic Elements */}
             <div className={`${styles.backgroundElement} ${styles.elementCircle1}`}></div>
             <div className={`${styles.backgroundElement} ${styles.elementSquare2}`}></div>
             <div className={`${styles.backgroundElement} ${styles.elementCircle3}`}></div>
             <div className={`${styles.backgroundElement} ${styles.elementSquare4}`}></div>
             <div className={`${styles.backgroundElement} ${styles.elementCircle5}`}></div>
             <div className={`${styles.backgroundElement} ${styles.elementSquare6}`}></div>
             <div className={`${styles.backgroundElement} ${styles.elementCircle7}`}></div>
             {/* Add more as needed for density */}

            <div className={styles.clubLoginContainer}>
                <div className={styles.logoArea}>
                    {/* Using the icon here */}
                     <LockKeyhole size={60} color="var(--cprimary-color)" className={styles.lockIcon} /> {/* Use CSS variable for color */}
                    {/* Replace with your actual logo if available and desired */}
                    {/* <img src="/images/oca.jpg" alt="OCA Logo" className={styles.clubLoginContainer__img} /> */}
                </div>
                <h2 className={styles.clubLoginTitle}>Club Login</h2>

                {/* Error Message Display */}
                {error && (
                    <div className={styles.errorMessage}>
                         {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <div className={styles.inputGroup}>
                         <User size={20} className={styles.inputIcon} /> {/* Icon for input */}
                        <input
                             type="text" // Changed to text to allow non-numeric if needed, adjust placeholder accordingly
                             name="cid"
                             value={cid}
                             onChange={(e) => setCid(e.target.value)}
                             required
                             placeholder=" " // Keep placeholder for the label animation
                             className={styles.inputField}
                             id="cid" // Added ID for label association
                        />
                         <label htmlFor="cid" className={styles.inputLabel}>Club ID</label> {/* Linked label to input */}
                    </div>
                    <div className={styles.inputGroup}>
                         <KeyRound size={20} className={styles.inputIcon} /> {/* Icon for input */}
                        <input
                             type="password"
                             name="cpassword"
                             value={cpassword}
                             onChange={(e) => setCpassword(e.target.value)}
                             required
                             placeholder=" " // Keep placeholder for the label animation
                             className={styles.inputField}
                             id="cpassword" // Added ID for label association
                        />
                         <label htmlFor="cpassword" className={styles.inputLabel}>Password</label> {/* Linked label to input */}
                    </div>
                    <div className={styles.formOptions}>
                         <label className={styles.rememberMe}>
                             <input type="checkbox" className={styles.rememberMeCheckbox} /> Remember me
                         </label>
                         <Link to="/" className={styles.forgotPasswordLink}>Forgot password?</Link> {/* Use Link */}
                    </div>
                    <button type="submit" className={styles.loginButton}>Log In</button>
                </form>

                <div className={styles.registerLink}>
                    {/* Changed link text for clarity */}
                     <p>Back to <Link to="/" className={styles.registerLink__a}>Homepage</Link></p> {/* Use Link */}
                </div>

                {/* Added subtle decorative elements */}
                 <div className={styles.decorativeLine}></div>
                 {/* <div className={styles.decorativeLine}></div> Removed one for better spacing below link */}

            </div>
        </div>
    );
};

export default ClubLogin;