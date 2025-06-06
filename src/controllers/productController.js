const { Op } = require('sequelize');
const { Product, Category, ProductImage, ProductOption } = require('../config/sequelize');

module.exports.createProduct = async (req, res) => {
  const t = await Product.sequelize.transaction();

  try {
    const {
      enabled = true,
      name,
      slug,
      stock,
      description,
      price,
      price_with_discount,
      category_ids,
      images,
      options,
    } = req.body;

    if (!name || !slug) {
      throw new Error('Nome e slug são obrigatórios.');
    }

    const newProduct = await Product.create({
      enabled,
      name,
      slug,
      stock,
      description,
      price,
      price_with_discount,
    }, { transaction: t });

    if (Array.isArray(category_ids) && category_ids.length > 0) {
      const existingCategories = await Category.findAll({
        where: { id: category_ids }
      });

      if (existingCategories.length !== category_ids.length) {
        throw new Error('Uma ou mais categorias não existem.');
      }

      await newProduct.setCategories(category_ids, { transaction: t });
    }

    if (Array.isArray(images)) {
      for (const img of images) {
        const base64Data = img.content.replace(/^data:image\/\w+;base64,/, '');

        await ProductImage.create({
          product_id: newProduct.id,
          content: base64Data,
          type: img.type, 
          enabled: true,
        }, { transaction: t });
      }
    }

    if (Array.isArray(options)) {
      for (const opt of options) {
        const values = opt.values || opt.value || []; 
        for (const val of values) {
          await ProductOption.create({
            product_id: newProduct.id,
            title: opt.title,
            shape: opt.shape,
            radius: opt.radius || null,
            type: opt.type,
            value: val,
          }, { transaction: t });
        }
      }
    }

    await t.commit();
    return res.status(201).json({ message: 'Produto criado com sucesso.', id: newProduct.id });

  } catch (error) {
    console.error('Erro ao criar produto:', error.message);
    await t.rollback();
    return res.status(400).json({ message: 'Erro ao criar produto.', details: error.message });
  }
};

module.exports.searchProducts = async (req, res) => {
  try {
    const {
      limit = '12',
      page = '1',
      fields,
      match,
      category_ids,
      'price-range': priceRange,
      option,
    } = req.query;

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    const queryOptions = {
      where: {},
      include: [],
      distinct: true,
    };

    if (limitNum !== -1) {
      queryOptions.limit = limitNum;
      queryOptions.offset = (pageNum - 1) * limitNum;
    }

    if (match) {
      queryOptions.where[Op.or] = [
        { name: { [Op.like]: `%${match}%` } },
        { description: { [Op.like]: `%${match}%` } },
      ];
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        queryOptions.where.price = { [Op.between]: [min, max] };
      }
    }

    if (category_ids) {
      const ids = category_ids.split(',').map(Number);
      queryOptions.include.push({
        model: Category,
        as: 'categories',
        where: { id: ids },
        through: { attributes: [] },
        required: true,
      });
    } else {
      queryOptions.include.push({
        model: Category,
        as: 'categories',
        through: { attributes: [] },
        required: false,
      });
    }

    if (option) {
      Object.entries(option).forEach(([optionId, values]) => {
        queryOptions.include.push({
          model: ProductOption,
          as: 'options',
          where: {
            id: Number(optionId),
            value: { [Op.in]: values.split(',') },
          },
          required: true,
        });
      });
    } else {
      queryOptions.include.push({
        model: ProductOption,
        as: 'options',
      });
    }

    queryOptions.include.push({
      model: ProductImage,
      as: 'images',
      required: false,
    });

    const { rows, count } = await Product.findAndCountAll(queryOptions);

    const defaultFields = [
      'id',
      'enabled',
      'name',
      'slug',
      'stock',
      'description',
      'price',
      'price_with_discount',
      'category_ids',
      'images',
      'options',
    ];

    const selectedFields = fields ? fields.split(',') : defaultFields;

    const data = rows.map((product) => {
      const p = product.toJSON();

      const obj = {};

      for (const field of selectedFields) {
        switch (field) {
          case 'category_ids':
            obj.category_ids = p.categories?.map((c) => c.id) || [];
            break;

          case 'images':
            obj.images = (p.images || []).map((img) => ({
              id: img.id,
              content: img.content || img.path || '', 
            }));
            break;

          case 'options':
            obj.options = p.options || [];
            break;

          default:
            if (p.hasOwnProperty(field)) {
              obj[field] = p[field];
            }
            break;
        }
      }

      return obj;
    });

    return res.status(200).json({
      data,
      total: count,
      limit: limitNum === -1 ? count : limitNum,
      page: limitNum === -1 ? 1 : pageNum,
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return res.status(400).json({ message: 'Requisição inválida.' });
  }
};

module.exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'categories', through: { attributes: [] } },
        { model: ProductImage, as: 'images' },
        { model: ProductOption, as: 'options' },
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const obj = product.toJSON();

    obj.category_ids = product.categories?.map(c => c.id) || [];

    obj.images = product.images.map(img => ({
      id: img.id,
      content: `http://localhost:3000/media/product/${product.slug}/image/${img.id}`
    }));

    return res.status(200).json(obj);

  } catch (error) {
    console.error('Erro ao buscar produto por ID:', error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

module.exports.updateProduct = async (req, res) => {
  const t = await Product.sequelize.transaction();
  const productId = req.params.id;

  try {
    const {
      enabled,
      name,
      slug,
      stock,
      description,
      price,
      price_with_discount,
      category_ids,
      images = [],
      options = [],
    } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
s
    await product.update({
      enabled,
      name,
      slug,
      stock,
      description,
      price,
      price_with_discount,
    }, { transaction: t });

    if (Array.isArray(category_ids)) {
      const existingCategories = await Category.findAll({
        where: { id: category_ids }
      });

      if (existingCategories.length !== category_ids.length) {
        throw new Error('Uma ou mais categorias não existem.');
      }

      await product.setCategories(category_ids, { transaction: t });
    }

    for (const img of images) {
      if (img.deleted && img.id) {
        await ProductImage.destroy({ where: { id: img.id, product_id: productId }, transaction: t });
      } else if (img.id && img.content) {
        const base64Data = img.content.replace(/^data:image\/\w+;base64,/, '');
        await ProductImage.update(
          { content: base64Data, type: img.type },
          { where: { id: img.id, product_id: productId }, transaction: t }
        );
      } else if (!img.id && img.content) {
        const base64Data = img.content.replace(/^data:image\/\w+;base64,/, '');
        await ProductImage.create({
          product_id: productId,
          content: base64Data,
          type: img.type,
          enabled: true,
        }, { transaction: t });
      }
    }

    for (const opt of options) {
      const values = opt.values || opt.value || [];

      if (opt.deleted && opt.id) {
        await ProductOption.destroy({ where: { id: opt.id, product_id: productId }, transaction: t });
      } else if (opt.id) {

        await ProductOption.destroy({ where: { id: opt.id, product_id: productId }, transaction: t });

        for (const val of values) {
          await ProductOption.create({
            product_id: productId,
            title: opt.title,
            shape: opt.shape,
            type: opt.type,
            radius: opt.radius || null,
            value: val,
          }, { transaction: t });
        }
      } else {
        for (const val of values) {
          await ProductOption.create({
            product_id: productId,
            title: opt.title,
            shape: opt.shape,
            type: opt.type,
            radius: opt.radius || null,
            value: val,
          }, { transaction: t });
        }
      }
    }

    await t.commit();
    return res.status(204).send();

  } catch (error) {
    console.error('Erro ao atualizar produto:', error.message);
    await t.rollback();
    return res.status(400).json({ message: 'Erro ao atualizar produto.', details: error.message });
  }
};
module.exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    await product.destroy();

    return res.status(204).send(); 
  } catch (error) {
    console.error('Erro ao deletar produto:', error.message);
    return res.status(500).json({ message: 'Erro ao deletar produto.' });
  }
};

module.exports.serveProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await ProductImage.findByPk(imageId);

    if (!image) {
      return res.status(404).json({ message: 'Imagem não encontrada.' });
    }

    const imgBuffer = Buffer.from(image.content, 'base64');
    res.set('Content-Type', image.type);
    return res.send(imgBuffer);

  } catch (error) {
    console.error('Erro ao servir imagem:', error);
    return res.status(500).json({ message: 'Erro interno ao carregar imagem.' });
  }
};
