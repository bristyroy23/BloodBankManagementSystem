const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// FORGOT PASSWORD
router.post("/forgot", (req, res) => {
    const { email, role } = req.body;

    let table;

    if (role === "admin") {
        table = "admins";
    } else if (role === "user") {
        table = "users";
    } else {
        return res.status(400).json({
            success: false,
            message: "Invalid account type"
        });
    }

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }

    db.query(
        "SELECT * FROM " + table + " WHERE email = ?",
        [email],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Email not found"
                });
            }

            const token = crypto.randomBytes(32).toString("hex");
            const tokenHash = crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

            const expires = new Date(Date.now() + 15 * 60 * 1000);

            db.query(
                "DELETE FROM password_resets WHERE email = ? AND role = ?",
                [email, role],
                (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Database Error"
                        });
                    }

                    db.query(
                        "INSERT INTO password_resets (email, role, token_hash, expires_at) VALUES (?, ?, ?, ?)",
                        [email, role, tokenHash, expires],
                        async (err) => {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: "Token Save Failed"
                                });
                            }

                            try {
                                const link = "http://127.0.0.1:5500/frontend/reset-password.html?token=" + token;

                                await transporter.sendMail({
                                    from: process.env.EMAIL_USER,
                                    to: email,
                                    subject: "Blood Bank Password Reset",
                                    html: "<h2>Password Reset</h2><p>Click the link below to reset your password:</p><a href='" + link + "'>Reset Password</a><p>This link expires in 15 minutes.</p>"
                                });

                                res.json({
                                    success: true,
                                    message: "Password reset link sent to your email"
                                });
                            } catch (error) {
                                console.log(error);

                                res.status(500).json({
                                    success: false,
                                    message: "Email sending failed. Check Gmail settings."
                                });
                            }
                        }
                    );
                }
            );
        }
    );
});

// RESET PASSWORD
router.post("/reset", (req, res) => {
    const { token, password } = req.body;

    if (!token || !password || password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters"
        });
    }

    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    db.query(
        "SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()",
        [tokenHash],
        async (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired reset link"
                });
            }

            const reset = result[0];

            const table = reset.role === "admin" ? "admins" : "users";

            try {
                const hashedPassword = await bcrypt.hash(password, 10);

                db.query(
                    "UPDATE " + table + " SET password = ? WHERE email = ?",
                    [hashedPassword, reset.email],
                    (err) => {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: "Password Update Failed"
                            });
                        }

                        db.query(
                            "UPDATE password_resets SET used_at = NOW() WHERE id = ?",
                            [reset.id],
                            (err) => {
                                if (err) {
                                    return res.status(500).json({
                                        success: false,
                                        message: "Token Update Failed"
                                    });
                                }

                                res.json({
                                    success: true,
                                    message: "Password Changed Successfully"
                                });
                            }
                        );
                    }
                );
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Password Hashing Failed"
                });
            }
        }
    );
});

module.exports = router;