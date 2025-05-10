import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StudentLogin.module.css'; // Assuming you'll create a StudentLogin.module.css

const StudentLogin = () => {
    const [uid, setUid] = useState('');
    const [upassword, setUpassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        console.log('Sending UID:', uid, 'Password:', upassword);
        try {
            const res = await fetch('http://localhost:3001/api/students/login', { // Adjust the API endpoint if needed
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uid, upassword }),
                credentials: 'include'
            });

            const data = await res.json();

            if (res.ok) {
                alert('Login Successful');
                localStorage.setItem('studentId', data.student._id); // Store student ID or relevant info
                localStorage.setItem('studentName', data.student.uname);
                console.log('Student ID stored:', data.student._id);
                console.log('Attempting to navigate to /student/dashboard'); // Adjust the route
                navigate('/student/dashboard');
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed (Frontend)');
        }
    };

    return (
        <div className={styles.studentLoginBody}>
            <div className={styles.studentLoginContainer}>
                <img src="/images/oca.jpg" alt="Student Logo" className={styles.studentLoginContainer__img} /> {/* Replace with your student logo */}
                <h2 className={styles.studentLoginContainer__h2}>Student Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.studentLoginContainer__inputGroup}>
                        <input
                            type="number"
                            name="uid"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                            required
                            placeholder=" "
                            className={styles.studentLoginContainer__inputGroup__input}
                        />
                        <label className={styles.studentLoginContainer__inputGroup__label}>Enter Student ID</label>
                    </div>
                    <div className={styles.studentLoginContainer__inputGroup}>
                        <input
                            type="password"
                            name="upassword"
                            value={upassword}
                            onChange={(e) => setUpassword(e.target.value)}
                            required
                            placeholder=" "
                            className={styles.studentLoginContainer__inputGroup__input}
                        />
                        <label className={styles.studentLoginContainer__inputGroup__label}>Enter your password</label>
                    </div>
                    <div className={styles.studentLoginContainer__options}>
                        <label>
                            <input type="checkbox" /> Remember me
                        </label>
                        <a href="/forgot-password" className={styles.studentLoginContainer__options__a}>Forgot password?</a> {/* Adjust the link */}
                    </div>
                    <button type="submit" className={styles.studentLoginContainer__button}>Log In</button>
                    {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display any error messages */}
                    <div className={styles.studentLoginContainer__register}>
                        <p>Not a member? <a href="/register-student" className={styles.studentLoginContainer__register__a}>Register here</a></p> {/* Adjust the link */}
                        <p>Back to <a href="/login-selection" className={styles.studentLoginContainer__register__a}>Login Selection</a></p> {/* Adjust the link */}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentLogin;