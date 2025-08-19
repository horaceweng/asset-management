const db = require('./config/db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const schemaPath = path.resolve(__dirname, '../database/schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
const saltRounds = 10;

db.serialize(() => {
    // Execute schema script
    db.exec(schemaSql, (err) => {
        if (err) {
            return console.error("Error executing schema:", err.message);
        }
        console.log("Database schema created successfully.");
        insertInitialData();
    });
});

function insertInitialData() {
    const insertRoles = `INSERT INTO roles (role_name) VALUES ('system_admin'), ('asset_manager'), ('user')`;
    db.run(insertRoles, function(err) {
        if (err) {
            // It might fail if already inserted, which is okay.
            console.log("Initial roles might already exist.");
        } else {
            console.log("Initial roles inserted.");
        }

        // Now, create a default admin user
        const adminPassword = 'admin';
        bcrypt.hash(adminPassword, saltRounds, (err, hash) => {
            if (err) {
                return console.error("Error hashing password:", err.message);
            }
            // Get role_id for 'system_admin'
            db.get("SELECT id FROM roles WHERE role_name = 'system_admin'", [], (err, adminRole) => {
                if (err || !adminRole) {
                    return console.error("Could not find system_admin role.");
                }

                const insertAdmin = `INSERT INTO users (username, password_hash, full_name, role_id) VALUES (?, ?, ?, ?)`;
                db.run(insertAdmin, ['admin', hash, 'System Administrator', adminRole.id], function(err) {
                    if (err) {
                        console.log("Admin user might already exist.");
                    } else {
                        console.log("Default admin user created (admin/admin).");
                    }
                    
                    // Close the database connection after all operations
                    db.close((err) => {
                        if (err) {
                            return console.error(err.message);
                        }
                        console.log('Closed the database connection.');
                    });
                });
            });
        });
    });
}
