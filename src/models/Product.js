const { DataTypes, Model } = require('sequelize');

class Product extends Model {}

module.exports = (sequelize) => {
  Product.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      use_in_menu: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      price_with_discount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'products',
      timestamps: true,
      underscored: true,
    }
  );

  Product.associate = (models) => {
    Product.hasMany(models.ProductImage, {
      foreignKey: 'product_id',
      as: 'images',
    });

    Product.hasMany(models.ProductOption, {
      foreignKey: 'product_id',
      as: 'options',
    });

    Product.belongsToMany(models.Category, {
        through: 'product_categories', 
        foreignKey: 'product_id',
        otherKey: 'category_id',
        as: 'categories',
    });
  };

  return Product;
};
