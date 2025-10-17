const jwt = require('jsonwebtoken');
const { User } = require('../../src/config/sequelize.js');
const userController = require('../../src/controllers/authController.js');

jest.mock('jsonwebtoken'); // O bcrypt não é mais usado diretamente no controller
jest.mock('../../src/config/sequelize.js');

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  console.log.mockRestore();
});

describe('User Controller', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
     mockRequest = {
      body: {},
      params: {},
      user: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      cookie: jest.fn().mockReturnThis(), // Mock para a função de cookie
      clearCookie: jest.fn().mockReturnThis(), // Mock para a função de limpar cookie
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('deve retornar 400 se algum campo estiver faltando', async () => {
      const testCases = [
        { firstname: 'John', surname: 'Doe', email: 'john@test.com' }, 
        { firstname: 'John', surname: 'Doe', password: '123' }, 
        { email: 'john@test.com', password: '123' } 
      ];

      for (const body of testCases) {
        mockRequest.body = body;
        await userController.createUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: 'Todos os campos são obrigatórios'
        });
      }
    });

    it('deve retornar 400 se as senhas não coincidirem', async () => {
      mockRequest.body = {
        firstname: 'John',
        surname: 'Doe',
        email: 'john@test.com',
        password: '123',
        confirmPassword: '456'
      };

      await userController.createUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'As senhas não coincidem'
      });
    });

    it('deve retornar 400 se o email já estiver em uso', async () => {
      mockRequest.body = {
        firstname: 'John',
        surname: 'Doe',
        email: 'existing@test.com',
        password: '123',
        confirmPassword: '123'
      };

      User.findOne.mockResolvedValue({ email: 'existing@test.com' });

      await userController.createUser(mockRequest, mockResponse);
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'existing@test.com' } });
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Email já está em uso'
      });
    });

    it('deve criar um usuário com sucesso', async () => {
      mockRequest.body = {
        firstname: 'John',
        surname: 'Doe',
        email: 'new@test.com',
        password: '123',
        confirmPassword: '123'
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({});

      await userController.createUser(mockRequest, mockResponse);
      // O hash agora é responsabilidade do model (hook), não do controller.
      expect(User.create).toHaveBeenCalledWith({
        firstname: 'John',
        surname: 'Doe',
        email: 'new@test.com',
        password: '123', // O controller passa a senha original
        role: 'customer'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário criado com sucesso'
      });
    });

    it('deve retornar 500 em caso de erro no servidor', async () => {
      mockRequest.body = {
        firstname: 'John',
        surname: 'Doe',
        email: 'new@test.com',
        password: '123',
        confirmPassword: '123'
      };

      User.findOne.mockRejectedValue(new Error('Database error'));

      await userController.createUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Erro ao criar usuário'
      });
    });
  });

  describe('loginUser', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('deve retornar token para login válido', async () => {
      const fakeUser = {
        id: 1,
        email: 'teste@email.com',
        role: 'customer',
        checkPassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne = jest.fn().mockResolvedValue(fakeUser);
      jwt.sign = jest.fn().mockReturnValue('token_fake');

      mockRequest.body = { email: 'teste@email.com', password: 'senha123' };

      await userController.loginUser(mockRequest, mockResponse);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'teste@email.com' } });
      expect(fakeUser.checkPassword).toHaveBeenCalledWith('senha123'); 
      expect(jwt.sign).toHaveBeenCalled();
      
      // Verifica se o cookie foi setado corretamente
      expect(mockResponse.cookie).toHaveBeenCalledWith("token", "token_fake", {httpOnly: true, secure: true});

      // Verifica a nova resposta JSON
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Login realizado com sucesso',
        user: {
          id: 1,
          email: 'teste@email.com',
          role: 'customer',
        }
      });
    });

    it('deve retornar 400 se usuário não encontrado', async () => {
      User.findOne.mockResolvedValue(null);
      mockRequest.body = { email: 'naoexiste@email.com', password: 'senha123' };
      await userController.loginUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Credenciais inválidas' });
    });

    it('deve retornar 400 se senha inválida', async () => {
    const fakeUser = {
      id: 1,
      email: 'teste@email.com',
      checkPassword: jest.fn().mockResolvedValue(false), // mocka falso para senha errada
    };

    User.findOne = jest.fn().mockResolvedValue(fakeUser);

    mockRequest.body = { email: 'teste@email.com', password: 'senhaErrada' };
    await userController.loginUser(mockRequest, mockResponse);

    expect(fakeUser.checkPassword).toHaveBeenCalledWith('senhaErrada');
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Credenciais inválidas' });
    });

    it('deve retornar 500 em caso de erro inesperado', async () => {
      User.findOne.mockRejectedValue(new Error('Erro inesperado'));
      mockRequest.body = { email: 'teste@email.com', password: 'senha123' };
      await userController.loginUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Erro ao fazer login' });
    });
  });

  describe('getUserById', () => {
    it('deve retornar 404 se o usuário não for encontrado', async () => {
      mockRequest.user = {
        id: 1,
        role: 'customer'
      };
      mockRequest.params.id = '1';
      User.findByPk.mockResolvedValue(null);

      await userController.getUserById(mockRequest, mockResponse);
      expect(User.findByPk).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário não encontrado'
      });
    });

    it('deve retornar 403 se um usuário tentar ver os dados de outro', async () => {
      mockRequest.user = { id: 2, role: 'customer' }; // Usuário logado
      mockRequest.params.id = '1'; // Tentando ver o usuário 1

      // O findByPk não precisa ser mockado, pois a verificação de autorização vem antes.
      const mockUser = { id: 1, get: jest.fn() };
      User.findByPk.mockResolvedValue(mockUser);

      await userController.getUserById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Não autorizado' });
    });

    it('deve retornar os dados do usuário sem a senha', async () => {
      const mockUser = {
        id: 1,
        firstname: 'John',
        surname: 'Doe',
        email: 'john@test.com',
        password: 'hashedPassword',
        role: 'customer',
        get: jest.fn().mockReturnValue({
          id: 1,
          firstname: 'John',
          surname: 'Doe',
          email: 'john@test.com',
          role: 'customer'
        })
      };

      mockRequest.user = { id: 1, role: 'customer' };
      mockRequest.params.id = '1';
      User.findByPk.mockResolvedValue(mockUser);

      await userController.getUserById(mockRequest, mockResponse);

      expect(mockUser.get).toHaveBeenCalledWith({ plain: true });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 1,
        firstname: 'John',
        surname: 'Doe',
        email: 'john@test.com',
        role: 'customer'
      });
    });

    it('deve retornar 500 em caso de erro no servidor', async () => {
      mockRequest.user = { id: 1, role: 'customer' };
      mockRequest.params.id = '1';
      User.findByPk.mockRejectedValue(new Error('Database error'));

      await userController.getUserById(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Erro interno do servidor'
      });
    });
  });

  describe('updateUser', () => {
    it('deve retornar 400 se campos obrigatórios estiverem faltando', async () => {
      mockRequest.params.id = '1';
      mockRequest.body = { firstname: '', surname: 'Doe', email: 'email@test.com' };
      mockRequest.user = { id: 1, role: 'customer' };

      await userController.updateUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Campos firstname, surname e email são obrigatórios.'
      });
    });

    it('deve retornar 403 se o usuário tentar atualizar outro usuário (não admin)', async () => {
      mockRequest.params.id = '2';
      mockRequest.body = { firstname: 'John', surname: 'Doe', email: 'email@test.com' };
      mockRequest.user = { id: 1, role: 'customer' };

      await userController.updateUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Não autorizado.'
      });
    });

    it('deve retornar 404 se usuário não for encontrado', async () => {
      mockRequest.params.id = '1';
      mockRequest.body = { firstname: 'John', surname: 'Doe', email: 'email@test.com' };
      mockRequest.user = { id: 1, role: 'customer' };

      User.findByPk.mockResolvedValue(null);

      await userController.updateUser(mockRequest, mockResponse);
      expect(User.findByPk).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário não encontrado.'
      });
    });

    it('deve retornar 400 se email já estiver em uso por outro usuário', async () => {
      mockRequest.params.id = '1';
      mockRequest.body = { firstname: 'John', surname: 'Doe', email: 'newemail@test.com' };
      mockRequest.user = { id: 1, role: 'customer' };

      const mockUser = {
        id: 1,
        email: 'oldemail@test.com',
        update: jest.fn()
      };
      User.findByPk.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue({ id: 2, email: 'newemail@test.com' });

      await userController.updateUser(mockRequest, mockResponse);
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'newemail@test.com' } });
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Email já está em uso'
      });
    });

    it('deve atualizar usuário com sucesso', async () => {
      mockRequest.params.id = '1';
      mockRequest.body = { firstname: 'John', surname: 'Doe', email: 'email@test.com' };
      mockRequest.user = { id: 1, role: 'customer' };

      const mockUser = {
        id: 1,
        email: 'email@test.com',
        update: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue(null);

      await userController.updateUser(mockRequest, mockResponse);

      expect(mockUser.update).toHaveBeenCalledWith({
        firstname: 'John',
        surname: 'Doe',
        email: 'email@test.com',
        // role não é atualizado pois o usuário não é admin
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalledWith(); 
    });

    it('deve retornar 500 em caso de erro inesperado', async () => {
      mockRequest.params.id = '1';
      mockRequest.body = { firstname: 'John', surname: 'Doe', email: 'email@test.com' };
      mockRequest.user = { id: 1, role: 'customer' };

      User.findByPk.mockRejectedValue(new Error('DB error'));

      await userController.updateUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Erro ao atualizar usuário' });
    });
  });

  describe('deleteUser', () => {
    it('deve retornar 401 se usuário tentar deletar outro usuário', async () => {
      mockRequest.params.id = '2';
      mockRequest.user = { id: 1, role: 'customer' };

      await userController.deleteUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Não autorizado.'
      });
    });

    it('deve retornar 404 se usuário não for encontrado', async () => {
      mockRequest.params.id = '1';
      mockRequest.user = { id: 1, role: 'customer' };

      User.findByPk.mockResolvedValue(null);

      await userController.deleteUser(mockRequest, mockResponse);
      expect(User.findByPk).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário não encontrado.'
      });
    });

    it('deve deletar usuário com sucesso', async () => {
      mockRequest.params.id = '1';
      mockRequest.user = { id: 1, role: 'customer' };

      const mockUser = {
        destroy: jest.fn().mockResolvedValue(true)
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.deleteUser(mockRequest, mockResponse);
      expect(mockUser.destroy).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('deve retornar 500 em caso de erro inesperado', async () => {
      mockRequest.params.id = '1';
      mockRequest.user = { id: 1, role: 'customer' };

      User.findByPk.mockRejectedValue(new Error('DB error'));

      await userController.deleteUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Erro ao deletar usuário' });
    });
  });

  describe('logoutUser', () => {
    it('deve limpar o cookie e retornar uma mensagem de sucesso', () => {
      userController.logoutUser(mockRequest, mockResponse);

      // Verifica se clearCookie foi chamado com o nome correto do cookie
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('token');

      // Verifica se a resposta JSON está correta
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Logged out successfully!",
      });

      // Verifica se o status não foi setado, o que resulta em 200 OK por padrão no Express
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

});