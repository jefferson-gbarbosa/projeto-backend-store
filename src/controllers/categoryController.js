const { op } = require('sequelize');
const { Op } = require('sequelize');
const { Category } = require('../config/sequelize');

module.exports.search = async (req, res) => {
  try {
    let {
      limit = '12',
      page = '1',
      fields,
      use_in_menu,
    } = req.query;

    limit = parseInt(limit);
    page = parseInt(page);

    if (isNaN(limit) || limit < -1 || isNaN(page) || page < 1) {
      return res.status(400).json({ error: 'Parâmetros inválidos: limit ou page' });
    }

    const queryOptions = {
      where: {},
      offset: 0,
      limit: limit === -1 ? undefined : limit,
    };

    if (limit !== -1) {
      queryOptions.offset = (page - 1) * limit;
    }

    if (use_in_menu !== undefined) {
      queryOptions.where.use_in_menu = use_in_menu === 'true';
    }

    if (fields) {
      queryOptions.attributes = fields.split(',').map(f => f.trim());
    }

    const { count, rows } = await Category.findAndCountAll(queryOptions);

    return res.status(200).json({
      data: rows,
      total: count,
      limit: limit,
      page: page,
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return res.status(400).json({ error: 'Erro ao buscar categorias' });
  }
}

module.exports.getCategoryById = async (req, res) => {
    const { id } = req.params;

  try {
    const category = await Category.findByPk(id, {
      attributes: ['id', 'name', 'slug', 'use_in_menu']
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
}

module.exports.createCategory = async (req, res) => {
  const { name, slug, use_in_menu } = req.body;
 
 if (
    typeof name !== 'string' || name.trim() === '' ||
    typeof slug !== 'string' || slug.trim() === '' ||
    typeof use_in_menu !== 'boolean'
  ) {
    return res.status(400).json({ error: 'Dados inválidos para cadastro' });
  }

  try {
     const category = await Category.create({
      name: name.trim(),
      slug: slug.trim(),
      use_in_menu
    });
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cadastrar categoria' });
  }
}

module.exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, use_in_menu } = req.body;

 if (typeof name !== 'string' || typeof slug !== 'string' || typeof use_in_menu !== 'boolean') {
    return res.status(400).json({ error: 'Dados inválidos para atualização' });
  }

  try {
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    await category.update({ name, slug, use_in_menu });

    return res.status(204).send(); 
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
};

module.exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    await category.destroy();

    return res.status(204).send(); 
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
