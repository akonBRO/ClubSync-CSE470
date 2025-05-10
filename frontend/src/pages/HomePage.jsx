import React, { useState, useEffect } from 'react';
import './HomePage.css'; // Link the CSS file
import { ArrowLeft, ArrowRight, Info, Calendar, Mail, Users, Zap, Award, CheckCircle, Globe, BarChart2 } from 'lucide-react'; // Added more icons

// Rename the component to HomePage for clarity
function HomePage() {
  // State for the carousel index and animation trigger
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quoteAnimating, setQuoteAnimating] = useState(false); // State to trigger fade animation

  const quotes = [
    { text: "“The future belongs to those who believe in the beauty of their dreams.”", author: "- Eleanor Roosevelt" },
    { text: "“Success is not final, failure is not fatal: It is the courage to continue that counts.”", author: "- Winston Churchill" },
    { text: "“Leadership is not about being in charge, it’s about taking care of those in your charge.”", author: "- Simon Sinek" },
    { text: "“The best way to predict the future is to create it.”", author: "- Peter Drucker" },
  ];

  // Auto-advance carousel and handle animation
  useEffect(() => {
    setQuoteAnimating(true); // Start fade-in animation when quote changes
    const interval = setInterval(() => {
      setQuoteAnimating(false); // Start fade-out before changing
      setTimeout(() => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        setQuoteAnimating(true); // Start fade-in for new quote
      }, 800); // Allow time for fade-out (matches CSS transition duration)
    }, 7000); // Change quote every 7 seconds (including fade time)

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, [quotes.length]);

  // Manual navigation with animation handling
  const navigateQuote = (direction) => {
    setQuoteAnimating(false); // Start fade-out
    setTimeout(() => {
      setCurrentQuoteIndex((prevIndex) => {
        const newIndex = direction === 'next'
          ? (prevIndex + 1) % quotes.length
          : (prevIndex - 1 + quotes.length) % quotes.length;
        return newIndex;
      });
      setQuoteAnimating(true); // Start fade-in for new quote
    }, 800); // Allow time for fade-out
  };


  // Features data using more icons
  const features = [
    { icon: <Users size={45} />, title: "Community Building", description: "Connect with like-minded students and form strong club communities easily." },
    { icon: <Calendar size={45} />, title: "Event Management", description: "Organize, promote, and manage club events and fests seamlessly with integrated tools." },
    { icon: <Zap size={45} />, title: "Efficient Communication", description: "Stay connected with members through announcements, messages, and real-time updates." },
    { icon: <Award size={45} />, title: "Skill Development", description: "Discover workshops and activities designed to enhance your leadership and creative skills." },
    { icon: <BarChart2 size={45} />, title: "Track Progress", description: "Monitor club activities, attendance, and achievements with insightful analytics." },
    { icon: <Globe size={45} />, title: "Explore Opportunities", description: "Find new clubs, join exciting projects, and expand your horizons within the university." },
  ];


  return (
    // Main container div uses a prefixed class name
    <div className="clubsync-app-container">
      {/* Navbar */}
      <nav className="clubsync-navbar">
        <div className="clubsync-container clubsync-navbar-content">
          <a href="#" className="clubsync-navbar-brand">ClubSync</a>
          {/* Navigation links could go here - added simple placeholders */}
          <ul className="clubsync-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            {/* <li><a href="#contact">Contact</a></li> // Already in info section */}
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="clubsync-hero-section">
        {/* Background animation elements (using the class defined in CSS) */}
        <div className="clubsync-background-bubbles">
          <span></span><span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>

        <div className="clubsync-hero-content">
          <h1 className="clubsync-hero-title">
            Sync Your <span className="brand-highlight">Clubs</span>, Sync Your <span className="brand-highlight">Experience</span>
          </h1>
          <p className="clubsync-hero-subtitle">
            The ultimate platform for students and clubs to connect, collaborate, and thrive.
          </p>
          <div className="clubsync-login-buttons">
            <a href="/login-student" className="clubsync-button-link">
              <button className="clubsync-button primary-button">
                <Users size={20} /> Student Login
              </button>
            </a>
            <a href="/login-club" className="clubsync-button-link">
              <button className="clubsync-button secondary-button">
                <Award size={20} /> Club Login
              </button>
            </a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="clubsync-features-section">
        <div className="clubsync-container">
          <h2 className="clubsync-section-title">Key Features</h2>
          <div className="clubsync-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="clubsync-feature-item">
                <div className="clubsync-feature-icon">
                  {feature.icon}
                </div>
                <h3 className="clubsync-feature-title">{feature.title}</h3>
                <p className="clubsync-feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* About/Info Section */}
       <section id="about" className="clubsync-info-section clubsync-container">
        <div className="clubsync-info-container">
          {/* About Box */}
          <div className="clubsync-info-box about-box">
            <div className="clubsync-info-icon">
              <Info size={40} />
            </div>
            <h3 className="clubsync-info-title">About ClubSync</h3>
            <p className="clubsync-info-text">
              ClubSync is the central hub for student clubs and activities, fostering creativity, leadership, and community engagement within the university.
            </p>
          </div>

          {/* What We Do Box */}
          <div className="clubsync-info-box what-we-do-box">
            <div className="clubsync-info-icon">
              <CheckCircle size={40} /> {/* Changed icon */}
            </div>
            <h3 className="clubsync-info-title">Our Mission</h3> {/* Changed title */}
            <p className="clubsync-info-text">
              We aim to simplify club management for organizers and enhance the student experience by making it easy to find and join activities.
            </p>
          </div>

          {/* Contact Us Box */}
          <div className="clubsync-info-box contact-box">
            <div className="clubsync-info-icon">
              <Mail size={40} />
            </div>
            <h3 className="clubsync-info-title">Get In Touch</h3> {/* Changed title */}
            <p className="clubsync-info-text">
              Email: oca@bracu.ac.bd<br />Phone: +880-2-12345678
            </p>
          </div>
        </div>
      </section>


  
      


      {/* Footer */}
      <footer className="clubsync-footer">
        <p>&copy; 2025 Sabbir, Sadik, Mushfiq & Muntasir | CSE470 Project: ClubSync</p>
      </footer>
    </div>
  );
}

export default HomePage;