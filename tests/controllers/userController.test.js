const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../src/config/sequelize.js');
const userController = require('../../src/controllers/authController.js');

// Mock dos módulos
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/sequelize.js');

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
      send: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('deve retornar 400 se algum campo estiver faltando', async () => {
      const testCases = [
        { firstname: 'John', surname: 'Doe', email: 'john@test.com' }, // falta password
        { firstname: 'John', surname: 'Doe', password: '123' }, // falta email
        { email: 'john@test.com', password: '123' } // falta firstname
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
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.create.mockResolvedValue({});

      await userController.createUser(mockRequest, mockResponse);
      expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
      expect(User.create).toHaveBeenCalledWith({
        firstname: 'John',
        surname: 'Doe',
        email: 'new@test.com',
        password: 'hashedPassword'
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
        get: jest.fn().mockReturnValue('hashed_password'),
      };
      User.findOne.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token_fake');

      mockRequest.body = { email: 'teste@email.com', password: 'senha123' };
      await userController.loginUser(mockRequest, mockResponse);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'teste@email.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('senha123', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ token: 'token_fake' });
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
        get: jest.fn().mockReturnValue('hashed_password'),
      };
      User.findOne.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(false);

      mockRequest.body = { email: 'teste@email.com', password: 'senhaErrada' };
      await userController.loginUser(mockRequest, mockResponse);

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
      mockRequest.params.id = '1';
      User.findByPk.mockResolvedValue(null);

      await userController.getUserById(mockRequest, mockResponse);
      expect(User.findByPk).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário não encontrado'
      });
    });

    it('deve retornar os dados do usuário sem a senha', async () => {
      const mockUser = {
        id: 1,
        firstname: 'John',
        surname: 'Doe',
        email: 'john@test.com',
        password: 'hashedPassword'
      };

      mockRequest.params.id = '1';
      User.findByPk.mockResolvedValue(mockUser);

      await userController.getUserById(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 1,
        firstname: 'John',
        surname: 'Doe',
        email: 'john@test.com'
      });
    });

    it('deve retornar 500 em caso de erro no servidor', async () => {
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
      mockRequest.user.id = 1;

      await userController.updateUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Campos firstname, surname e email são obrigatórios.'
      });
    });

    it('deve retornar 401 se o usuário tentar atualizar outro usuário', async () => {
      mockRequest.params.id = '2';
      mockRequest.body = { firstname: 'John', surname: 'Doe', email: 'email@test.com' };
      mockRequest.user.id = 1;

      await userController.updateUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Não autorizado a atualizar este usuário.'
      });
    });

    it('deve retornar 404 se usuário não for encontrado', async () => {
      mockRequest.params.id = '1';
      mockRequest.body = { firstname: 'John', surname: 'Doe', email: 'email@test.com' };
      mockRequest.user.id = 1;

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
      mockRequest.user.id = 1;

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
      mockRequest.user.id = 1;

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
        email: 'email@test.com'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalledWith({
        id: 1,
        firstname: 'John',
        surname: 'Doe',
        email: 'email@test.com'
      });
    });

    it('deve retornar 500 em caso de erro inesperado', async () => {
      mockRequest.params.id = '1';
      mockRequest.body = { firstname: 'John', surname: 'Doe', email: 'email@test.com' };
      mockRequest.user.id = 1;

      User.findByPk.mockRejectedValue(new Error('DB error'));

      await userController.updateUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Erro ao atualizar usuário' });
    });
  });

  describe('deleteUser', () => {
    it('deve retornar 401 se usuário tentar deletar outro usuário', async () => {
      mockRequest.params.id = '2';
      mockRequest.user.id = 1;

      await userController.deleteUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Não autorizado a deletar este usuário.'
      });
    });

    it('deve retornar 404 se usuário não for encontrado', async () => {
      mockRequest.params.id = '1';
      mockRequest.user.id = 1;

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
      mockRequest.user.id = 1;

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
      mockRequest.user.id = 1;

      User.findByPk.mockRejectedValue(new Error('DB error'));

      await userController.deleteUser(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Erro ao deletar usuário' });
    });
  });

});