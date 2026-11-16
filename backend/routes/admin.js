
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Admin Login
router.post("/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    const sql = "SELECT * FROM admins WHERE email = ?";

    db.query(sql, [email], async (err, result) => {

        if (err) {
            console.error("DATABASE ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Database Error",
                error: err.message
            });
        }

        if (result.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Admin not found"
            });
        }

        const admin = result[0];

        try {

            // Check Admin Password
            const validPassword = await bcrypt.compare(
                password,
                admin.password
            );

            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: "Wrong Password"
                });
            }

            // Check JWT Secret
            console.log(
                "JWT SECRET LOADED:",
                !!process.env.JWT_SECRET
            );

            if (!process.env.JWT_SECRET) {
                return res.status(500).json({
                    success: false,
                    message: "JWT Secret is missing"
                });
            }

            // Generate Admin Token
            const token = jwt.sign(
                {
                    id: admin.id,
                    role: "admin"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );

            // Successful Login
            return res.json({
                success: true,
                message: "Admin Login Successful",
                token: token,
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email
                }
            });

        } catch (error) {

            console.error("ADMIN LOGIN ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Admin Login Failed",
                error: error.message
            });

        }

    });

});

module.exports = router;
