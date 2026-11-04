
const express = require("express");
const cors = require("cors");
const db = require("./db");
const adminRoutes = require("./routes/admin");
const donorRoutes = require("./routes/donors");
const bloodStockRoutes = require("./routes/bloodStock");
const userRoutes = require("./routes/users");
const passwordRoutes = require("./routes/password");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/admin", adminRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/blood-stock", bloodStockRoutes);
app.use("/api/user", userRoutes);
app.use("/api/password", passwordRoutes);
app.use(express.urlencoded({ extended: true }));


// Home Route
app.get("/", (req, res) => {
    res.send("Blood Bank Management System Running!");
});

// Database Test Route
app.get("/test-db", (req, res) => {
    db.query("SELECT 1", (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Connection Failed",
                error: err.message
            });
        }

        res.json({
            success: true,
            message: "Database Connected Successfully!"
        });
    });
});

// Server Start
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
