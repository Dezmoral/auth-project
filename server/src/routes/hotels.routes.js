import express from 'express';
import { getAllHotels } from '../models/hotel.model.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const hotels = await getAllHotels();
    res.json(hotels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
