const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class OrderTracking extends Model {
    static associate(models) {
      OrderTracking.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    }
  }

  OrderTracking.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      note: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'OrderTracking',
      tableName: 'order_tracking',
      timestamps: false,
      underscored: true,
    }
  );

  return OrderTracking;
};