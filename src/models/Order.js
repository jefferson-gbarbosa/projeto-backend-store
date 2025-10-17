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
      hooks: {
        async afterCreate(order, options) {
          const { OrderTracking } = sequelize.models;
          await OrderTracking.create({
            order_id: order.id,
            status: order.status,
            note: 'Pedido criado e aguardando confirmação',
          });
        },
        async afterUpdate(order, options) {
          if(order.changed('status')){
            const { OrderTracking } = sequelize.models;
            let note =`Status do pedido atualizado para ${order.status}`;
            let location = null;
            switch(order.status){
              case 'confirmed':
                note = 'Pedido confirmado pelo vendedor';
                break;
              case 'shipped':
                note = 'Pedido enviado ao cliente';
                location = 'Centro de Distribuição - Fortaleza/CE';
                break;
              case 'delivered':
                note = 'Pedido entregue ao cliente';
                location = 'Endereço do cliente';
                break;
              case 'canceled':
                note = 'Pedido cancelado';
                break;
            }
            await OrderTracking.create({
              order_id: order.id,
              status: order.status,
              note,
              location,
            });
          }
        },
      },
    }
  );

  return Order;
};