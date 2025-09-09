const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
  }
);

const User = require('../models/User')(sequelize);
const Category = require('../models/Category')(sequelize);
const Product = require('../models/Product')(sequelize);
const ProductImage = require('../models/ProductImage')(sequelize);
const ProductOption = require('../models/ProductOption')(sequelize);
const Order = require('../models/Order')(sequelize);
const OrderItem = require('../models/OrderItem')(sequelize);
const OrderTracking = require('../models/OrderTracking')(sequelize);

if (User.associate) User.associate(sequelize.models);
if (Category.associate) Category.associate(sequelize.models);
if (Product.associate) Product.associate(sequelize.models);
if (ProductImage.associate) ProductImage.associate(sequelize.models);
if (ProductOption.associate) ProductOption.associate(sequelize.models);
if (Order.associate) Order.associate(sequelize.models);
if (OrderItem.associate) OrderItem.associate(sequelize.models);
if (OrderTracking.associate) OrderTracking.associate(sequelize.models);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { 
    sequelize, 
    connectDB, 
    User,
    Category,
    Product,
    ProductImage,
    ProductOption,
    Order,
    OrderItem,
    OrderTracking,
};

if (require.main === module) {
  connectDB();
}
