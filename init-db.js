const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',         
    host: 'localhost',
    database: 'postgres',              // Connect to default database first to create 'subway'
    password: '64209',  // <-- Replace with your real Postgres password!
    port: 5432,
});

const schema = `
-- Users Table
CREATE TABLE IF NOT EXISTS surfer_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scores Table
CREATE TABLE IF NOT EXISTS surfer_scores (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES surfer_users(id) ON DELETE CASCADE UNIQUE,
    high_score INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function runSchema() {
    try {
        console.log("Connecting to PostgreSQL default instance...");
        
        // 1. Create the brand new database
        await pool.query('CREATE DATABASE subway;');
        console.log("Database 'subway' created successfully!");
        await pool.end(); // Close default connection

        // 2. Open a new connection pool directly targeting 'subway'
        const subwayPool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'subway',
            password: pool.options.password,
            port: 5432,
        });

        console.log("Building application tables inside 'subway'...");
        await subwayPool.query(schema);
        console.log("Database tables successfully built!");
        await subwayPool.end();

    } catch (err) {
        // If the database already exists (Postgres code 42P04), catch and build tables
        if (err.code === '42P04') {
            console.log("Database 'subway' already exists. Building tables...");
            try {
                const subwayPool = new Pool({ 
                    user: 'postgres', 
                    host: 'localhost', 
                    database: 'subway', 
                    password: pool.options.password, 
                    port: 5432 
                });
                await subwayPool.query(schema);
                console.log("Database tables successfully built!");
                await subwayPool.end();
            } catch (innerErr) {
                console.error("Error building tables:", innerErr);
            }
        } else {
            console.error("Initialization error:", err);
        }
    }
}

runSchema();