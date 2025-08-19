require('dotenv').config();
const express = require('express');
const app = express();
// ... existing code ...
const port = process.env.PORT || 3001;

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const assetRoutes = require('./routes/assets');
const publicRoutes = require('./routes/public');

app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve static files

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/public', publicRoutes);

app.get('/', (req, res) => {
  res.send('Asset Management System Backend');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
