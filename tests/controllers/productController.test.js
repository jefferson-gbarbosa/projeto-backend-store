const { Product, Category, ProductImage, ProductOption } = require('../../src/config/sequelize.js');
const productController = require('../../src/controllers/productController.js');

describe('createProduct', () => {
  const commit = jest.fn();
  const rollback = jest.fn();

  const mockTransaction = {
    commit,
    rollback
  };

  let req, res;

  beforeEach(() => {
    // Mocks de req e res
    req = {
      body: {
        name: 'Produto Teste',
        slug: 'produto-teste',
        stock: 10,
        description: 'Descrição do produto',
        price: 100,
        price_with_discount: 90,
        category_ids: [1, 2],
        images: [{
          content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
          type: 'image/png'
        }],
        options: [{
          title: 'Cor',
          type: 'select',
          values: ['Azul', 'Vermelho']
        }]
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset de mocks
    jest.clearAllMocks();

    // Mock da transaction
    Product.sequelize = { transaction: jest.fn().mockResolvedValue(mockTransaction) };

    // Mocks dos métodos usados
    Product.create = jest.fn();
    Category.findAll = jest.fn();
    ProductImage.create = jest.fn();
    ProductOption.create = jest.fn();
  });

  it('deve criar um produto com sucesso', async () => {
    const mockProduct = { id: 1, setCategories: jest.fn() };
    Product.create.mockResolvedValue(mockProduct);
    Category.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    await productController.createProduct(req, res);

    expect(Product.sequelize.transaction).toHaveBeenCalled();
    expect(Product.create).toHaveBeenCalledWith(expect.any(Object), { transaction: mockTransaction });
    expect(Category.findAll).toHaveBeenCalled();
    expect(ProductImage.create).toHaveBeenCalledTimes(1);
    expect(ProductOption.create).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Produto criado com sucesso.',
      id: 1
    });
  });

  it('deve retornar erro se nome ou slug estiverem ausentes', async () => {
    req.body.name = null;
    req.body.slug = null;

    await productController.createProduct(req, res);

    expect(rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Erro ao criar produto.',
      details: 'Nome e slug são obrigatórios.'
    }));
  });

  it('deve retornar erro se categorias não existirem', async () => {
    const mockProduct = { id: 1, setCategories: jest.fn() };
    Product.create.mockResolvedValue(mockProduct);
    Category.findAll.mockResolvedValue([{ id: 1 }]); // falta o id 2

    await productController.createProduct(req, res);

    expect(rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Erro ao criar produto.',
      details: 'Uma ou mais categorias não existem.'
    }));
  });
});

describe('searchProducts', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {
        limit: '12',
        page: '1',
        match: 'arroz',
        category_ids: '1,2',
        'price-range': '10-50',
        fields: 'id,name,price,category_ids',
        option: {
          5: 'GG,PP'
        }
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  it('deve buscar produtos com sucesso aplicando filtros', async () => {
    const mockProduct = {
      id: 1,
      name: 'Arroz Integral',
      price: 25,
      categories: [{ id: 1 }, { id: 2 }],
      images: [{ id: 1, content: 'img_base64' }],
      options: [],
      toJSON: function () {
        return this;
      }
    };

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      rows: [mockProduct],
      count: 1
    });

    await productController.searchProducts(req, res);

    expect(Product.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data: [
        {
          id: 1,
          name: 'Arroz Integral',
          price: 25,
          category_ids: [1, 2]
        }
      ],
      total: 1,
      limit: 12,
      page: 1
    });
  });

  it('deve lidar com erro interno e retornar 400', async () => {
    Product.findAndCountAll = jest.fn().mockRejectedValue(new Error('DB error'));

    await productController.searchProducts(req, res);

    expect(Product.findAndCountAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Requisição inválida.'
    });
  });
});


describe('getProductById', () => {
  let req, res;

  beforeEach(() => {
    req = { params: { id: '1' } };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  it('deve retornar o produto quando encontrado', async () => {
    const mockProduct = {
      id: 1,
      slug: 'arroz-integral',
      name: 'Arroz Integral',
      categories: [{ id: 1 }, { id: 2 }],
      images: [{ id: 10 }, { id: 11 }],
      options: [],
      toJSON: function () {
        return { ...this };
      }
    };

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    await productController.getProductById(req, res);

    expect(Product.findByPk).toHaveBeenCalledWith('1', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      slug: 'arroz-integral',
      category_ids: [1, 2],
      images: [
        { id: 10, content: 'http://localhost:3000/media/product/arroz-integral/image/10' },
        { id: 11, content: 'http://localhost:3000/media/product/arroz-integral/image/11' }
      ]
    }));
  });

  it('deve retornar 404 se o produto não for encontrado', async () => {
    Product.findByPk = jest.fn().mockResolvedValue(null);

    await productController.getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Produto não encontrado.' });
  });

  it('deve retornar 500 em caso de erro interno', async () => {
    Product.findByPk = jest.fn().mockRejectedValue(new Error('DB error'));

    await productController.getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Erro interno no servidor.' });
  });
});

describe('updateProduct', () => {
  let req, res, t;

  beforeEach(() => {
    req = {
      params: { id: '1' },
      body: {
        enabled: true,
        name: 'Novo nome',
        slug: 'novo-slug',
        stock: 100,
        description: 'Nova descrição',
        price: 50.0,
        price_with_discount: 40.0,
        category_ids: [1, 2],
        images: [],
        options: [],
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    t = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    Product.sequelize = { transaction: jest.fn().mockResolvedValue(t) };

    jest.clearAllMocks();
  });

  it('deve atualizar o produto com sucesso', async () => {
    const mockProduct = {
      id: 1,
      update: jest.fn(),
      setCategories: jest.fn(),
    };

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);
    Category.findAll = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
    ProductImage.destroy = jest.fn();
    ProductImage.update = jest.fn();
    ProductImage.create = jest.fn();
    ProductOption.destroy = jest.fn();
    ProductOption.create = jest.fn();

    await productController.updateProduct(req, res);

    expect(Product.findByPk).toHaveBeenCalledWith('1');
    expect(mockProduct.update).toHaveBeenCalledWith(expect.any(Object), { transaction: t });
    expect(mockProduct.setCategories).toHaveBeenCalledWith([1, 2], { transaction: t });
    expect(t.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deve retornar 404 se o produto não for encontrado', async () => {
    Product.findByPk = jest.fn().mockResolvedValue(null);

    await productController.updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Produto não encontrado.' });
    expect(t.rollback).not.toHaveBeenCalled(); // Nenhuma transação se iniciou
  });

  it('deve retornar 400 se categoria inválida for passada', async () => {
    const mockProduct = {
      update: jest.fn(),
      setCategories: jest.fn(),
    };

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);
    Category.findAll = jest.fn().mockResolvedValue([{ id: 1 }]); // Falta uma categoria

    await productController.updateProduct(req, res);

    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Erro ao atualizar produto.',
      details: 'Uma ou mais categorias não existem.',
    }));
  });

  it('deve retornar 400 em erro geral', async () => {
    Product.findByPk = jest.fn().mockRejectedValue(new Error('Erro inesperado'));

    await productController.updateProduct(req, res);

    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Erro ao atualizar produto.',
      details: 'Erro inesperado',
    }));
  });
});

describe('deleteProduct', () => {
  let req, res;

  beforeEach(() => {
    req = { params: { id: '1' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('deve deletar o produto com sucesso', async () => {
    const mockProduct = {
      destroy: jest.fn().mockResolvedValue(true),
    };

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    await productController.deleteProduct(req, res);

    expect(Product.findByPk).toHaveBeenCalledWith('1');
    expect(mockProduct.destroy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deve retornar 404 se o produto não for encontrado', async () => {
    Product.findByPk = jest.fn().mockResolvedValue(null);

    await productController.deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Produto não encontrado.' });
  });

  it('deve retornar 500 em caso de erro inesperado', async () => {
    Product.findByPk = jest.fn().mockRejectedValue(new Error('Erro inesperado'));

    await productController.deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Erro ao deletar produto.' });
  });
});