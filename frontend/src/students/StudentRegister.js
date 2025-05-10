import React, { useState } from 'react';
import axios from 'axios';
import styles from './StudentRegister.module.css';


function StudentRegister() {
  const [formData, setFormData] = useState({
    uname: '',
    dob: '',
    umail: '',
    uid: '',
    umobile: '',
    ugender: '',
    upassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3001/api/students/register', formData);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed Frontend");
    }
  };

  return (
    <div className={styles.studentRegisterBody}>
      <div className={styles.studentRegisterContainer}>
        <header className={styles.studentRegisterContainer__header}>User Registration</header>
        <form onSubmit={handleSubmit}>
          <div className="form first"> {/* Consider styling this div if needed */}
            <div className="details personal"> {/* Consider styling this div if needed */}
              <span className={styles.studentRegisterForm__title}>Personal Details</span>
              <div className={styles.studentRegisterForm__fields}>
                <div className={styles.studentRegisterForm__fields__inputField}>
                  <label className={styles.studentRegisterForm__fields__inputField__label}>Full Name</label>
                  <input type="text" name="uname" onChange={handleChange} className={styles.studentRegisterForm__fields__inputField__input} required />
                </div>
                <div className={styles.studentRegisterForm__fields__inputField}>
                  <label className={styles.studentRegisterForm__fields__inputField__label}>Date of Birth</label>
                  <input type="date" name="dob" onChange={handleChange} className={styles.studentRegisterForm__fields__inputField__input} required />
                </div>
                <div className={styles.studentRegisterForm__fields__inputField}>
                  <label className={styles.studentRegisterForm__fields__inputField__label}>Email</label>
                  <input type="email" name="umail" onChange={handleChange} className={styles.studentRegisterForm__fields__inputField__input} required />
                </div>
                <div className={styles.studentRegisterForm__fields__inputField}>
                  <label className={styles.studentRegisterForm__fields__inputField__label}>Student ID</label>
                  <input type="number" name="uid" onChange={handleChange} className={styles.studentRegisterForm__fields__inputField__input} required />
                </div>
                <div className={styles.studentRegisterForm__fields__inputField}>
                  <label className={styles.studentRegisterForm__fields__inputField__label}>Mobile Number</label>
                  <input type="number" name="umobile" onChange={handleChange} className={styles.studentRegisterForm__fields__inputField__input} required />
                </div>
                <div className={styles.studentRegisterForm__fields__inputField}>
                  <label className={styles.studentRegisterForm__fields__inputField__label}>Gender</label>
                  <select name="ugender" onChange={handleChange} className={styles.studentRegisterForm__fields__inputField__select} required>
                    <option disabled selected value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className={styles.studentRegisterForm__fields__inputField}>
                  <label className={styles.studentRegisterForm__fields__inputField__label}>Password</label>
                  <input type="password" name="upassword" onChange={handleChange} className={styles.studentRegisterForm__fields__inputField__input} required />
                </div>
              </div>
            </div>
            <button className={styles.studentRegisterForm__submitButton} type="submit"><span className="btnText">Submit</span></button> {/* 'btnText' was not in your CSS, consider adding if needed */}
            <p>Back to <a href="/login-student" className={styles.studentRegister__loginLink}>Login</a></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentRegister;