import { pool } from '../db.js';

export async function createUser(email, passwordHash, role = 'USER') {
  const res = await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
    [email, passwordHash, role]
  );
  return res.rows[0];
}

export async function getUserByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  return res.rows[0];
}

export async function getAllUsers() {
  const res = await pool.query('SELECT id, email, role, created_at FROM users');
  return res.rows;
}
