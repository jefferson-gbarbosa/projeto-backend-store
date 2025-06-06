const { op } = require('sequelize');
const { Category } = require('../config/sequelize');

module.exports.search = async (req, res) => {
    try {
    const {
      limit = 12,
      page = 1,
      fields,
      use_in_menu,
    } = req.query;

    const queryOptions = {
      where: {},
      offset: 0,
      limit: parseInt(limit) === -1 ? undefined : parseInt(limit),
    };

    if(!limit){
      return res.status(400).json({ error: 'Parâmetros inválidos: limit ou page' });
    }

    if (use_in_menu !== undefined) {
      queryOptions.where.use_in_menu = use_in_menu === 'true';
    }

    if (limit !== '-1') {
      const pageNumber = parseInt(page) || 1;
      queryOptions.offset = (pageNumber - 1) * queryOptions.limit;
    }

    if (fields) {
      queryOptions.attributes = fields.split(',');
    }

    const { count, rows } = await Category.findAndCountAll(queryOptions);

    res.status(200).json({
      data: rows,
      total: count,
      limit: parseInt(limit),
      page: parseInt(page),
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(400).json({ error: 'Erro ao buscar categorias' });
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
 
 if (!name || typeof slug !== 'string' || slug.length === 0 || typeof use_in_menu !== 'boolean') {
  
    console.log('Dados inválidos detectados, retornando 400');
    return res.status(400).json({ error: 'Dados inválidos para cadastro' });
  }

  try {
    const category = await Category.create(req.body);
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cadastrar categoria' });
  }
}

module.exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, use_in_menu } = req.body;

  if (!name || !slug || typeof use_in_menu !== 'boolean') {
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

    return res.status(204).send(); // Sem corpo
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
