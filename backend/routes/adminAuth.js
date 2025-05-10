const express = require('express');
const router = express.Router();
const Admin = require('../models/admin'); // Ensure the path is correct
console.log("✅ adminAuth.js loaded");

// --- AUTHENTICATION MIDDLEWARE ---
const authAdmin = (req, res, next) => {
    if (req.session && req.session.admin) {
        req.admin = req.session.admin; // Attach admin info to request
        next(); // User is authenticated, proceed
    } else {
        console.warn("Admin Auth failed: No active admin session.");
        // Sending 401 means the client needs to authenticate
        res.status(401).json({ message: "Authentication failed. Please log in as an admin." });
    }
};
// --- END AUTHENTICATION MIDDLEWARE ---


// --- ADMIN LOGIN ---
router.post("/login", async (req, res) => {
    const { adminId, password } = req.body; // Use adminId and password as per your model
    try {
        if (!adminId || !password) {
            return res.status(400).json({ message: "Admin ID and password are required" });
        }

        // Find the admin by adminId
        const admin = await Admin.findOne({ adminId: adminId });

        if (!admin) {
            console.log(`Admin login attempt failed: Admin ID ${adminId} not found.`);
            return res.status(401).json({ message: "Invalid Admin ID or password" });
        }

        // Compare the provided password with the stored password (plain text comparison - INSECURE)
        if (password === admin.password) {
            req.session.admin = {
                _id: admin._id.toString(),
                adminId: admin.adminId,
                username: admin.username // Store username in session
            };

            req.session.save(err => {
                if (err) {
                    console.error("Admin session save error:", err);
                    return res.status(500).json({ message: "Server error during admin login (session save)" });
                }
                console.log(`Admin login successful for Admin ID: ${admin.adminId}, Session admin set:`, req.session.admin);
                res.status(200).json({
                    message: "Admin login successful",
                    admin: {
                         _id: admin._id,
                         adminId: admin.adminId,
                         username: admin.username
                    }
                });
            });
        } else {
            console.log(`Admin login attempt failed: Incorrect password for Admin ID ${adminId}.`);
            return res.status(401).json({ message: "Invalid Admin ID or password" });
        }
    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ message: "Server error during admin login" });
    }
});

// --- CHECK ADMIN LOGIN STATUS ---
router.get("/check-auth", (req, res) => {
    if (req.session && req.session.admin) {
        res.status(200).json({ isLoggedIn: true, admin: req.session.admin });
    } else {
        console.log("Admin Auth check: No active session found.");
        res.status(200).json({ isLoggedIn: false });
    }
});


// --- ADMIN LOGOUT ---
router.post("/logout", (req, res) => {
    if (req.session) {
        const adminId = req.session.admin?.adminId;
        req.session.destroy(err => {
            if (err) {
                console.error("Admin Logout Error:", err);
                return res.status(500).json({ message: "Could not log out admin, please try again." });
            } else {
                // Clear the cookie only if session destruction is successful
                // Note: Ensure the cookie name matches what connect.sid uses, or just let the client handle it if not HttpOnly
                // For HttpOnly cookies, you might need `res.clearCookie('connect.sid');` depending on your setup
                 res.clearCookie('connect.sid'); // Example, verify actual cookie name
                console.log(`Admin Logout successful for Admin ID: ${adminId}`);
                return res.status(200).json({ message: "Admin Logout successful" });
            }
        });
    } else {
        return res.status(200).json({ message: "No active admin session to log out from." });
    }
});

// Export both the router and the middleware
module.exports = {
    router: router,
    authAdmin: authAdmin
};