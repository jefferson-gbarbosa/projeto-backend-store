const { DataTypes, Model } = require('sequelize');

class Category extends Model {}

module.exports = (sequelize) => {
  Category.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
        allowNull: true,
        defaultValue: false, 
      },
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'categories',
      timestamps: true,
      underscored: true, 
    }
  );
  Category.associate = (models) => {
    Category.belongsToMany(models.Product, {
      through: 'product_categories',
      foreignKey: 'category_id',
      otherKey: 'product_id',
      as: 'products',
    });
  };
  return Category;
};
