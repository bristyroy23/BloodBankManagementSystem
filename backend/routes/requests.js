
const express = require("express");
const router = express.Router();
const db = require("../db");

// Submit Blood Request
router.post("/add", (req, res) => {
    const {
        recipient_id,
        blood_group_id,
        hospital_id,
        quantity,
        request_date
    } = req.body;

    if (
        !recipient_id ||
        !blood_group_id ||
        !hospital_id ||
        !quantity ||
        !request_date
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const sql = `
        INSERT INTO blood_requests
        (recipient_id, blood_group_id, hospital_id, quantity, request_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            recipient_id,
            blood_group_id,
            hospital_id,
            quantity,
            request_date,
            "Pending"
        ],
        (err, result) => {
            if (err) {
                console.error("Blood Request Error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Request submit failed",
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: "Blood request submitted successfully!",
                requestId: result.insertId
            });
        }
    );
});

module.exports = router;
