
const express = require("express");
const router = express.Router();
const db = require("../db");

// Load Blood Groups and Hospitals
router.get("/options", (req, res) => {
    db.query(
        "SELECT id, blood_group FROM blood_groups",
        (err, bloodGroups) => {
            if (err) {
                console.log("Blood Group Error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Blood groups loading failed",
                    error: err.message
                });
            }

            db.query(
                "SELECT id, hospital_name FROM hospitals",
                (err, hospitals) => {
                    if (err) {
                        console.log("Hospital Error:", err);
                        return res.status(500).json({
                            success: false,
                            message: "Hospitals loading failed",
                            error: err.message
                        });
                    }

                    res.json({
                        success: true,
                        bloodGroups,
                        hospitals
                    });
                }
            );
        }
    );
});

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
        (recipient_id, blood_group_id, hospital_id,
         quantity, request_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        recipient_id,
        blood_group_id,
        hospital_id,
        quantity,
        request_date,
        "Pending"
    ], (err, result) => {
        if (err) {
            console.log("Blood Request Error:", err);
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
    });
});
// Get My Blood Requests
router.get("/my/:recipientId", (req, res) => {
    const recipientId = req.params.recipientId;

    const sql = `
        SELECT
            bg.blood_group,
            br.quantity,
            h.hospital_name,
            br.request_date,
            br.status
        FROM blood_requests br
        LEFT JOIN blood_groups bg
            ON br.blood_group_id = bg.id
        LEFT JOIN hospitals h
            ON br.hospital_id = h.id
        WHERE br.recipient_id = ?
        ORDER BY br.id DESC
    `;

    db.query(sql, [recipientId], (err, results) => {
        if (err) {
            console.log("My Requests Error:", err);
            return res.status(500).json({
                success: false,
                message: "Could not load requests"
            });
        }

        res.json({
            success: true,
            requests: results
        });
    });
});
module.exports = router;
