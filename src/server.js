require('dotenv').config();
const express = require('express');
const { connectDB } = require('../src/config/sequelize');
const authRouter = require('./routes/authRoutes.js')
const categoryRoutes = require('./routes/categoryRoutes.js');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

app.use("/v1/user",authRouter);
app.use('/v1/category', categoryRoutes);

const startServer = async () => {
  await connectDB(); 
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};

startServer();