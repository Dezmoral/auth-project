import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { checkDB } from './db.js';
import hotelsRouter from './routes/hotels.routes.js';

app.use('/api/hotels', hotelsRouter);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await checkDB();
});
