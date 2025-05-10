import React, { useState } from 'react';
import styles from './ClubRegister.module.css';

const ClubRegister = () => {
  const [formData, setFormData] = useState({
    cname: '',
    caname: '',
    cpname: '',
    cshortname: '',
    cmail: '',
    cmobile: '',
    cid: '',
    cpassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3001/api/clubs/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      alert(result.message);

      if (res.ok) {
        window.location.href = '/login-club'; // Navigate to club login page
      }
    } catch (err) {
      console.error('Frontend error:', err);
      alert('Registration failed (Frontend)');
    }
  };

  return (
    <div className={styles.clubRegisterBody}>
      <div className={styles.clubRegisterContainer}>
        <header className={styles.clubRegisterContainer__header}>Club Registration</header>

        <form onSubmit={handleSubmit} className={styles.clubRegisterContainer__form}>
          <div className={`${styles.clubRegisterForm__form} ${styles.clubRegisterForm__form__first}`}>
            <div className="details club"> {/* Consider prefixing 'details' and 'club' in CSS if needed */}
              <span className={styles.clubRegisterForm__title}>Details</span>

              <div className={styles.clubRegisterForm__fields}>
                <div className={styles.clubRegisterForm__fields__inputField}>
                  <label className={styles.clubRegisterForm__fields__inputField__label}>Club Name</label>
                  <input type="text" name="cname" value={formData.cname} onChange={handleChange} className={styles.clubRegisterForm__fields__inputField__input} required />
                </div>

                <div className={styles.clubRegisterForm__fields__inputField}>
                  <label className={styles.clubRegisterForm__fields__inputField__label}>Advisor Name</label>
                  <input type="text" name="caname" value={formData.caname} onChange={handleChange} className={styles.clubRegisterForm__fields__inputField__input} required />
                </div>

                <div className={styles.clubRegisterForm__fields__inputField}>
                  <label className={styles.clubRegisterForm__fields__inputField__label}>President Name</label>
                  <input type="text" name="cpname" value={formData.cpname} onChange={handleChange} className={styles.clubRegisterForm__fields__inputField__input} required />
                </div>

                <div className={styles.clubRegisterForm__fields__inputField}>
                  <label className={styles.clubRegisterForm__fields__inputField__label}>Club Short Name</label>
                  <input type="text" name="cshortname" value={formData.cshortname} onChange={handleChange} className={styles.clubRegisterForm__fields__inputField__input} required />
                </div>

                <div className={styles.clubRegisterForm__fields__inputField}>
                  <label className={styles.clubRegisterForm__fields__inputField__label}>Club Email</label>
                  <input type="email" name="cmail" value={formData.cmail} onChange={handleChange} className={styles.clubRegisterForm__fields__inputField__input} required />
                </div>

                <div className={styles.clubRegisterForm__fields__inputField}>
                  <label className={styles.clubRegisterForm__fields__inputField__label}>Mobile Number</label>
                  <input type="number" name="cmobile" value={formData.cmobile} onChange={handleChange} className={styles.clubRegisterForm__fields__inputField__input} required />
                </div>
                
                <div className={styles.clubRegisterForm__fields__inputField}>
                  <label className={styles.clubRegisterForm__fields__inputField__label}>Club ID</label>
                  <input type="number" name="cid" value={formData.cid} onChange={handleChange} className={styles.clubRegisterForm__fields__inputField__input} required min="10000000" max="99999999" />
                </div>
                <div className={styles.clubRegisterForm__fields__inputField}>
                  <label className={styles.clubRegisterForm__fields__inputField__label}>Choose Password</label>
                  <input type="password" name="cpassword" value={formData.cpassword} onChange={handleChange} className={styles.clubRegisterForm__fields__inputField__input} required />
                </div>
              </div>
            </div>

            <button type="submit" className={styles.clubRegisterForm__submitButton}>
              <span className={styles.clubRegisterForm__submitButton__btnText}>Submit</span>
            </button>

            <p>Back to <a href="/login-club" className={styles.clubRegister__loginLink}>Login</a></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClubRegister;