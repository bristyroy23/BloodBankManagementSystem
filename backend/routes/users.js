
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

// User Registration
router.post("/register", async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, email, phone, password)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [name, email, phone, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "Email already exists"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Registration Failed",
                    error: err.message
                });
            }

            const userId = result.insertId;

            // Save user information in recipients table
            const recipientSql = `
                INSERT INTO recipients (user_id, name, phone)
                VALUES (?, ?, ?)
            `;

            db.query(
                recipientSql,
                [userId, name, phone],
                (recipientErr, recipientResult) => {
                    if (recipientErr) {
                        console.error("Recipient Save Error:", recipientErr);

                        return res.status(500).json({
                            success: false,
                            message: "User registered but recipient information could not be saved",
                            error: recipientErr.message
                        });
                    }

                    res.json({
                        success: true,
                        message: "User Registration Successful",
                        userId: userId,
                        recipientId: recipientResult.insertId
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Password Hashing Failed"
        });
    }
});

// User Login
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (result.length === 0) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        const user = result[0];

        try {
            const validPassword = await bcrypt.compare(
                password,
                user.password
            );

            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: "Wrong Password"
                });
            }

            // Find recipient ID linked to this user
            db.query(
                "SELECT id FROM recipients WHERE user_id = ?",
                [user.id],
                (recipientErr, recipientResult) => {
                    if (recipientErr) {
                        return res.status(500).json({
                            success: false,
                            message: "Recipient lookup failed"
                        });
                    }

                    res.json({
                        success: true,
                        message: "User Login Successful",
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            recipientId: recipientResult.length > 0
                                ? recipientResult[0].id
                                : null
                        }
                    });
                }
            );
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Password Verification Error"
            });
        }
    });
});

module.exports = router;
