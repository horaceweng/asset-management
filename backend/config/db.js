const sqlite3 = require('sqlite3').verbose();

// Use an in-memory database for simplicity, or specify a file path
// const db = new sqlite3.Database(':memory:');
const db = new sqlite3.Database('./asset_management.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the asset_management SQLite database.');
});

module.exports = db;

