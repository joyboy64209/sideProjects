const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(express.json());

// Expose frontend HTML assets directly out of the project working copy context
app.use(express.static(path.join(__dirname)));

const JWT_SECRET = 'subway_secret_key_2026';

// Update with your PostgreSQL local credentials config parameters
const pool = new Pool({
    user: 'postgres',         
    host: 'localhost',
    database: 'subway', 
    password: '64209', 
    port: 5432,
});

// Middleware to protect internal route entries via JWT verification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token expired/invalid' });
        req.user = user;
        next();
    });
};

// Unified Auth Endpoint: Authenticates user (Creates row automatically if user doesn't exist)
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Credentials missing' });

    try {
        const userQuery = await pool.query('SELECT * FROM surfer_users WHERE username = $1', [username]);
        let user = userQuery.rows[0];

        if (!user) {
            // Register auto fallback flow
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await pool.query(
                'INSERT INTO surfer_users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
                [username, hashedPassword]
            );
            user = newUser.rows[0];
            await pool.query('INSERT INTO surfer_scores (user_id, high_score) VALUES ($1, 0)', [user.id]);
        } else {
            // Verify structural correctness matching stored hash
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) return res.status(401).json({ error: 'Invalid password credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal database transaction breakdown' });
    }
});

// Profile Lookup Endpoint
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const scoreQuery = await pool.query(
            'SELECT u.username, COALESCE(s.high_score, 0) as high_score FROM surfer_users u LEFT JOIN surfer_scores s ON u.id = s.user_id WHERE u.id = $1',
            [req.user.id]
        );
        res.json(scoreQuery.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to extract account details' });
    }
});

// Score Update Endpoint (Unity script can fetch this to save final metrics)
app.post('/api/user/score', authenticateToken, async (req, res) => {
    const { score } = req.body;
    try {
        await pool.query(
            'INSERT INTO surfer_scores (user_id, high_score) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET high_score = GREATEST(surfer_scores.high_score, EXCLUDED.high_score), last_updated = CURRENT_TIMESTAMP',
            [req.user.id, score]
        );
        res.json({ message: 'Score synchronized successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database synchronization failed' });
    }
});

// Explicit base redirection rule mapping fallback states down cleanly
app.get('/', (req, res) => res.redirect('/login.html'));

app.listen(3000, () => console.log('Surfers application ecosystem execution initialized over http://localhost:3000'));