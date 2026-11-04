const express = require("express");
const router = express.Router();
const db = require("../db");

// Get All Blood Stock
router.get("/all", (req, res) => {
    const sql = `
        SELECT 
            blood_stock.id,
            blood_groups.blood_group,
            blood_stock.quantity
        FROM blood_stock
        LEFT JOIN blood_groups
        ON blood_stock.blood_group_id = blood_groups.id
        ORDER BY blood_stock.id ASC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Blood Stock Fetch Failed",
                error: err.message
            });
        }

        res.json({
            success: true,
            bloodStock: result
        });
    });
});
// Update Blood Stock Quantity
router.put("/update/:id", (req, res) => {
    const stockId = req.params.id;
    const { quantity } = req.body;

    if (quantity === undefined || !Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
        return res.status(400).json({
            success: false,
            message: "Valid quantity is required"
        });
    }

    const sql = "UPDATE blood_stock SET quantity = ? WHERE id = ?";

    db.query(sql, [Number(quantity), stockId], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Blood Stock Update Failed",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Blood Stock Not Found"
            });
        }

        res.json({
            success: true,
            message: "Blood Stock Updated Successfully"
        });
    });
});
module.exports = router;