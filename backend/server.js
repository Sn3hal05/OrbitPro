const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const postRoutes = require('./routes/postRoutes');
const aiRoutes = require('./routes/aiRoutes');
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/orbitpro';

mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2500 })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.warn('MongoDB Atlas connection failed, falling back to local MongoDB:', err.message);
    mongoose.connect('mongodb://127.0.0.1:27017/orbitpro')
      .then(() => console.log('Connected to local MongoDB fallback'))
      .catch((localErr) => console.error('Local MongoDB fallback connection error:', localErr.message));
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));