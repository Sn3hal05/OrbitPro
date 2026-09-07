const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const postRoutes = require('./routes/postRoutes');
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/posts', postRoutes);

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