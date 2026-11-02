
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

// Admin Login
router.post("/login", (req, res) => {

    const { email, password } = req.body;

    const sql = "SELECT * FROM admins WHERE email = ?";

    db.query(sql, [email], async (err, result) => {

        if (err) {
            return res.status(500).send("Database Error");
        }

        if (result.length === 0) {
            return res.status(401).send("Admin not found");
        }

        const admin = result[0];

        try {
            const validPassword = await bcrypt.compare(
                password,
                admin.password
            );

            if (!validPassword) {
                return res.status(401).send("Wrong Password");
            }

            res.json({
                message: "Admin Login Successful",
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email
                }
            });

        } catch (error) {
            res.status(500).send("Password Verification Error");
        }

    });

});

module.exports = router;
