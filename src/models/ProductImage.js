const { DataTypes, Model } = require('sequelize');

class ProductImage extends Model {}

module.exports = (sequelize) => {
  ProductImage.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'products', 
          key: 'id',
        },
        onDelete: 'CASCADE', 
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      content: {
        type: DataTypes.TEXT('long'),  // para base64 ou dados grandes
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,  // para guardar o tipo mime, ex: image/png
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'ProductImage',
      tableName: 'product_images',
      timestamps: true,
      underscored: true,
    }
  );

  ProductImage.associate = (models) => {
    ProductImage.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product',
    });
  };

  return ProductImage;
};
