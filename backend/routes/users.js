
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const verifyAdmin = require("../middleware/auth");

// User Registration
router.post("/register", async (req, res) => {
    const {
        name,
        email,
        phone,
        age,
        gender,
        address,
        password
    } = req.body;

    if (
        !name || !email || !phone ||
        !age || !gender || !address || !password
    ) {
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

            const recipientSql = `
                INSERT INTO recipients
                (user_id, name, phone, age, gender, address)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(
                recipientSql,
                [userId, name, phone, age, gender, address],
                (recipientErr, recipientResult) => {
                    if (recipientErr) {
                        console.error("Recipient Save Error:", recipientErr);

                        return res.status(500).json({
                            success: false,
                            message: "Recipient information could not be saved",
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

// Get All Registered Users (Admin Only)
router.get("/", verifyAdmin, (req, res) => {
    const sql = `
        SELECT id, name, email, phone
        FROM users
        ORDER BY id DESC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to load users",
                error: err.message
            });
        }

        res.json({
            success: true,
            users: result
        });
    });
});

// Delete User (Admin Only)
router.delete("/:id", verifyAdmin, (req, res) => {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid User ID"
        });
    }

    db.query(
        "DELETE FROM users WHERE id = ?",
        [userId],
        (err, result) => {
            if (err) {
                console.error("Delete User Error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Could not delete user. This user may have related records.",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            res.json({
                success: true,
                message: "User deleted successfully"
            });
        }
    );
});

module.exports = router;
