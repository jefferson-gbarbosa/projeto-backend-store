const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
      Order.hasMany(models.OrderTracking, { foreignKey: 'order_id', as: 'tracking' });
    }
  }

  Order.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'confirmed',
          'shipped',
          'delivered',
          'canceled'
        ),
        defaultValue: 'pending',
      },
      total_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
      timestamps: true,
      underscored: true,
    }
  );

  return Order;
};