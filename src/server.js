require('dotenv').config();
const express = require('express');
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { connectDB } = require('../src/config/sequelize');

const authRouter = require('./routes/authRoutes.js')
const categoryRoutes = require('./routes/categoryRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const orderTrackingRoutes = require('./routes/orderTrackingRoutes.js'); 

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const YAML = require('yamljs')
const swaggerFile = YAML.load('./swagger.yaml')

const app = express();
app.use(express.json());
app.use(cookieParser());
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    credentials: true,
  })
);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running smoothly.' });
});

app.use("/v1/user",authRouter);
app.use('/v1/category', categoryRoutes);
app.use('/v1/product', productRoutes);
app.use('/v1/tracking', orderTrackingRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get('/api.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerFile);
});

const startServer = async () => {
  await connectDB(); 
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};

startServer();