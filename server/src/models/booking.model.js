import { pool } from '../db.js';

export async function createBooking(userId, hotelId, dateFrom, dateTo, status='CONFIRMED') {
  const res = await pool.query(
    'INSERT INTO bookings (user_id, hotel_id, date_from, date_to, status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [userId, hotelId, dateFrom, dateTo, status]
  );
  return res.rows[0];
}

export async function getBookingsByUser(userId) {
  const res = await pool.query('SELECT * FROM bookings WHERE user_id=$1', [userId]);
  return res.rows;
}
