import { pool } from '../db.js';

export async function getAllHotels() {
  const res = await pool.query('SELECT * FROM hotels');
  return res.rows;
}

export async function createHotel(name, city, description, price, rating) {
  const res = await pool.query(
    'INSERT INTO hotels (name, city, description, price_per_night, rating) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [name, city, description, price, rating]
  );
  return res.rows[0];
}
