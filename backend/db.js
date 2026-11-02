const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bloodbankmanagement"
});

db.connect((err) => {
    if (err) {
        console.log("Database Error:", err.message);
    } else {
        console.log("Database Connected Successfully!");
    }
});

module.exports = db;