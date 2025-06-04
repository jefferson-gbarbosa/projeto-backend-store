const { Category } = require('../../src/config/sequelize.js');
const categoryController = require('../../src/controllers/categoryController');

// Mock do Express
const mockRequest = (data = {}) => ({
  body: data.body || {},
  params: data.params || {},
  query: data.query || {},
});
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

jest.mock('../../src/config/sequelize.js');


beforeEach(() => {
  // Silencia os logs no terminal
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe('createCategory', () => {
  let req, res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
  });

  it('deve criar uma categoria com sucesso', async () => {
    const fakeCategory = {
      id: 1,
      name: 'Hortaliças',
      slug: 'hortalicas',
      use_in_menu: true,
    };

    req.body = {
      name: 'Hortaliças',
      slug: 'hortalicas',
      use_in_menu: true,
    };

    Category.create.mockResolvedValue(fakeCategory);

    await categoryController.createCategory(req, res); // <- aqui

    expect(Category.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeCategory);
  });

  it('deve retornar erro 400 para dados inválidos', async () => {
    req.body = {
      name: 'Legumes',
      slug: '', // inválido
      use_in_menu: 'yes', // não boolean
    };

    await categoryController.createCategory(req, res); // <- aqui

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Dados inválidos para cadastro' });
    expect(Category.create).not.toHaveBeenCalled();
  });

  it('deve retornar erro 500 em caso de falha na criação', async () => {
    req.body = {
      name: 'Frutas',
      slug: 'frutas',
      use_in_menu: true,
    };

    Category.create.mockRejectedValue(new Error('Erro no banco'));

    await categoryController.createCategory(req, res); // <- aqui

    expect(Category.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao cadastrar categoria' });
  });
});

describe('getCategoryById controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: '1' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('deve retornar a categoria quando encontrada', async () => {
    const mockCategory = { id: 1, name: 'Frutas', slug: 'frutas', use_in_menu: true };

    Category.findByPk.mockResolvedValue(mockCategory);

    await categoryController.getCategoryById(req, res);

    expect(Category.findByPk).toHaveBeenCalledWith('1', {
      attributes: ['id', 'name', 'slug', 'use_in_menu'],
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockCategory);
  });

  it('deve retornar 404 quando a categoria não for encontrada', async () => {
    Category.findByPk.mockResolvedValue(null);

    await categoryController.getCategoryById(req, res);

    expect(Category.findByPk).toHaveBeenCalledWith('1', {
      attributes: ['id', 'name', 'slug', 'use_in_menu'],
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Categoria não encontrada' });
  });

  it('deve retornar 500 em caso de erro no servidor', async () => {
    Category.findByPk.mockRejectedValue(new Error('DB Error'));

    await categoryController.getCategoryById(req, res);

    expect(Category.findByPk).toHaveBeenCalledWith('1', {
      attributes: ['id', 'name', 'slug', 'use_in_menu'],
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar categoria' });
  });
});

describe('search controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('deve retornar resultados padrão com paginação e limite default', async () => {
    const mockResult = {
      count: 20,
      rows: [{ id: 1, name: 'Frutas', use_in_menu: true }],
    };

    Category.findAndCountAll.mockResolvedValue(mockResult);

    await categoryController.search(req, res);

    expect(Category.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      offset: 0,
      limit: 12,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: mockResult.rows,
      total: mockResult.count,
      limit: 12,
      page: 1,
    });
  });

  it('deve filtrar por use_in_menu true', async () => {
    const mockResult = {
      count: 5,
      rows: [{ id: 2, name: 'Legumes', use_in_menu: true }],
    };

    req.query = {
      use_in_menu: 'true',
      limit: '5',
      page: '1',
    };

    Category.findAndCountAll.mockResolvedValue(mockResult);

    await categoryController.search(req, res);

    expect(Category.findAndCountAll).toHaveBeenCalledWith({
      where: { use_in_menu: true },
      offset: 0,
      limit: 5,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: mockResult.rows,
      total: mockResult.count,
      limit: 5,
      page: 1,
    });
  });

  it('deve incluir somente os campos especificados em fields', async () => {
    const mockResult = {
      count: 3,
      rows: [{ id: 3, name: 'Cereais' }],
    };

    req.query = {
      fields: 'id,name',
      limit: '10',
      page: '2',
    };

    Category.findAndCountAll.mockResolvedValue(mockResult);

    await categoryController.search(req, res);

    expect(Category.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      offset: 10, // (page 2 -1) * limit 10 = 10
      limit: 10,
      attributes: ['id', 'name'],
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: mockResult.rows,
      total: mockResult.count,
      limit: 10,
      page: 2,
    });
  });

  it('deve tratar limite = -1 como sem limite e offset zero', async () => {
    const mockResult = {
      count: 2,
      rows: [{ id: 4, name: 'Flores' }],
    };

    req.query = {
      limit: '-1',
      page: '1',
    };

    Category.findAndCountAll.mockResolvedValue(mockResult);

    await categoryController.search(req, res);

    expect(Category.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      offset: 0,
      limit: undefined,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: mockResult.rows,
      total: mockResult.count,
      limit: -1,
      page: 1,
    });
  });

  it('deve retornar erro 400 em caso de exceção', async () => {
    req.query = {
      limit: '10',
    };

    Category.findAndCountAll.mockRejectedValue(new Error('DB error'));

    await categoryController.search(req, res);

    expect(Category.findAndCountAll).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar categorias' });
  });
});

describe('updateCategory controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { id: '1' },
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  it('deve atualizar uma categoria com sucesso retornando 204', async () => {
    req.body = {
      name: 'Frutas Atualizadas',
      slug: 'frutas-atualizadas',
      use_in_menu: true,
    };

    const mockCategoryInstance = {
      update: jest.fn().mockResolvedValue(),
    };

    Category.findByPk.mockResolvedValue(mockCategoryInstance);

    await categoryController.updateCategory(req, res);

    expect(Category.findByPk).toHaveBeenCalledWith('1');
    expect(mockCategoryInstance.update).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deve retornar 400 para dados inválidos', async () => {
    req.body = {
      name: '',
      slug: 'slug-valido',
      use_in_menu: 'sim',  // não booleano
    };

    await categoryController.updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Dados inválidos para atualização' });
    expect(Category.findByPk).not.toHaveBeenCalled();
  });

  it('deve retornar 404 se a categoria não existir', async () => {
    req.body = {
      name: 'Nome',
      slug: 'slug',
      use_in_menu: false,
    };

    Category.findByPk.mockResolvedValue(null);

    await categoryController.updateCategory(req, res);

    expect(Category.findByPk).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Categoria não encontrada' });
  });

  it('deve retornar 500 em caso de erro no servidor', async () => {
    req.body = {
      name: 'Nome',
      slug: 'slug',
      use_in_menu: true,
    };

    Category.findByPk.mockRejectedValue(new Error('Erro no banco'));

    await categoryController.updateCategory(req, res);

    expect(Category.findByPk).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao atualizar categoria' });
  });
});

describe('deleteCategory controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { id: '1' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
  });

  it('deve deletar a categoria com sucesso retornando 204', async () => {
    const mockCategoryInstance = {
      destroy: jest.fn().mockResolvedValue(),
    };

    Category.findByPk.mockResolvedValue(mockCategoryInstance);

    await categoryController.deleteCategory(req, res);

    expect(Category.findByPk).toHaveBeenCalledWith('1');
    expect(mockCategoryInstance.destroy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deve retornar 404 quando a categoria não for encontrada', async () => {
    Category.findByPk.mockResolvedValue(null);

    await categoryController.deleteCategory(req, res);

    expect(Category.findByPk).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Categoria não encontrada' });
  });

  it('deve retornar 500 em caso de erro no servidor', async () => {
    Category.findByPk.mockRejectedValue(new Error('Erro no banco'));

    await categoryController.deleteCategory(req, res);

    expect(Category.findByPk).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno do servidor' });
  });
});