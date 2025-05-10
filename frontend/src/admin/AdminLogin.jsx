import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminLogin.module.css'; // Make sure this CSS file exists

const AdminLogin = () => {
    // Changed state variable name to adminId to match backend expectation
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // Log adminId instead of username
        console.log('Sending Admin ID:', adminId, 'Password:', password);

        try {
            // Corrected API endpoint to match index.js mounting point (/api/admins)
            const res = await fetch('http://localhost:3001/api/admins/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Send adminId in the request body as expected by the backend
                body: JSON.stringify({ adminId, password }),
                credentials: 'include' // Important for sending cookies (session ID)
            });

            const data = await res.json();

            if (res.ok) {
                // Removed "(F)" from the alert
                alert('Admin Login Successful');

                // Storing _id as adminId in local storage as per your original code
                // You could also store data.admin.adminId (the string ID) or data.admin.username
                localStorage.setItem('adminId', data.admin._id);
                localStorage.setItem('adminName', data.admin.username); // Storing username for display
                console.log('Admin _id stored:', data.admin._id);
                console.log('Admin username stored:', data.admin.username);

                // Navigate to the admin dashboard
                navigate('/admin/dashboard'); // Ensure this route exists in your frontend router

            } else {
                // Display specific error message from the backend if available
                setError(data.message || 'Admin login failed.');
            }
        } catch (error) {
            console.error('Admin Login error:', error);
            // Provide a more user-friendly error message for unexpected issues
            setError('An unexpected error occurred during login. Please try again.');
        }
    };

    return (
        <div className={styles.adminLoginBody}>
            <div className={styles.adminLoginContainer}>
                <img src="/images/admin.jpg" alt="Admin Logo" className={styles.adminLoginContainer__img} />
                <h2 className={styles.adminLoginContainer__h2}>Admin Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.adminLoginContainer__inputGroup}>
                        <input
                            type="text" // Use text for adminId as per your schema
                            name="adminId" // Use name 'adminId'
                            value={adminId} // Use state variable adminId
                            onChange={(e) => setAdminId(e.target.value)} // Update adminId state
                            required
                            placeholder=" "
                            className={styles.adminLoginContainer__inputGroup__input}
                        />
                        {/* Changed label to reflect Admin ID */}
                        <label className={styles.adminLoginContainer__inputGroup__label}>Enter Admin ID</label>
                    </div>
                    <div className={styles.adminLoginContainer__inputGroup}>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder=" "
                            className={styles.adminLoginContainer__inputGroup__input}
                        />
                        <label className={styles.adminLoginContainer__inputGroup__label}>Enter your password</label>
                    </div>
                    {/* Keep remember me and forgot password sections if desired */}
                    <div className={styles.adminLoginContainer__options}>
                        <label>
                            <input type="checkbox" /> Remember me
                        </label>
                        <a href="/forgot-password" className={styles.adminLoginContainer__options__a}>Forgot password?</a> {/* Adjust the link */}
                    </div>
                    <button type="submit" className={styles.adminLoginContainer__button}>Log In</button>
                    {/* Display error message */}
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                    <div className={styles.adminLoginContainer__register}>
                        {/* Changed text for clarity */}
                        <p>Back to <a href="/login-selection" className={styles.adminLoginContainer__register__a}>Login Selection</a></p> {/* Adjust the link */}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;