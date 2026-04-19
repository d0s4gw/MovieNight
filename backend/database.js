const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'movienight.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the SQLite database.');
        
        db.serialize(() => {
            // Table for Users
            db.run(`CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT CHECK(type IN ('adult', 'child')) NOT NULL,
                age INTEGER
            )`);

            // Drop old table to migrate schema
            db.run(`DROP TABLE IF EXISTS UserPreferences`);

            // Table for storing liked/disliked movies per user
            db.run(`CREATE TABLE IF NOT EXISTS UserPreferences (
                userId INTEGER,
                movieId INTEGER,
                preference TEXT CHECK(preference IN ('like', 'dislike')),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (userId, movieId),
                FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
            )`);
            
            // Table for API caching
            db.run(`CREATE TABLE IF NOT EXISTS Cache (
                key TEXT PRIMARY KEY,
                value TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        });
    }
});

module.exports = db;
