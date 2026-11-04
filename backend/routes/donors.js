const express = require("express");
const router = express.Router();
const db = require("../db");

// Add New Donor
router.post("/add", (req, res) => {

    const {
        name,
        phone,
        age,
        gender,
        blood_group,
        email,
        address,
        last_donation
    } = req.body;

    const findBloodGroup = "SELECT id FROM blood_groups WHERE blood_group = ?";

    db.query(findBloodGroup, [blood_group], (err, result) => {

        if (err) {
            return res.status(500).json({ message: "Database Error" });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: "Blood Group Not Found" });
        }

        const bloodGroupId = result[0].id;

        const sql = `
            INSERT INTO donors
            (name, phone, age, gender, blood_group_id, email, address, last_donation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [
            name,
            phone,
            age,
            gender,
            bloodGroupId,
            email || null,
            address || null,
            last_donation || null
        ], (err, result) => {

            if (err) {
                return res.status(500).json({ message: "Donor Add Failed", error: err.message });
            }

            res.json({
                success: true,
                message: "Donor Added Successfully",
                donorId: result.insertId
            });

        });
    });
});
// Get All Donors
router.get("/all", (req, res) => {
    const sql = `
        SELECT 
            donors.id,
            donors.name,
            donors.phone,
            donors.email,
            donors.age,
            donors.gender,
            blood_groups.blood_group,
            donors.address,
            donors.last_donation
        FROM donors
        LEFT JOIN blood_groups
        ON donors.blood_group_id = blood_groups.id
        ORDER BY donors.id DESC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Donor Fetch Failed",
                error: err.message
            });
        }

        res.json({
            success: true,
            donors: result
        });
    });
});
// Delete Donor
router.delete("/delete/:id", (req, res) => {
    const donorId = req.params.id;

    const sql = "DELETE FROM donors WHERE id = ?";

    db.query(sql, [donorId], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Donor Delete Failed",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Donor Not Found"
            });
        }

        res.json({
            success: true,
            message: "Donor Deleted Successfully"
        });
    });
});
// Update Donor
router.put("/update/:id", (req, res) => {

    const donorId = req.params.id;

    const {
        name,
        phone,
        email,
        age,
        gender,
        blood_group,
        address,
        last_donation
    } = req.body;

    // Find Blood Group ID
    const findBloodGroup =
        "SELECT id FROM blood_groups WHERE blood_group = ?";

    db.query(findBloodGroup, [blood_group], (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Database Error"
            });
        }

        if (result.length === 0) {
            return res.status(400).json({
                message: "Blood Group Not Found"
            });
        }

        const bloodGroupId = result[0].id;

        const sql = `
            UPDATE donors
            SET name = ?,
                phone = ?,
                email = ?,
                age = ?,
                gender = ?,
                blood_group_id = ?,
                address = ?,
                last_donation = ?
            WHERE id = ?
        `;

        db.query(sql, [
            name,
            phone,
            email || null,
            age,
            gender,
            bloodGroupId,
            address || null,
            last_donation || null,
            donorId
        ], (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Donor Update Failed",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Donor Not Found"
                });
            }

            res.json({
                success: true,
                message: "Donor Updated Successfully"
            });

        });
    });
});
module.exports = router;