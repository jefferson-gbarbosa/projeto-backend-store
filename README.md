<p align="center">
  <img width="115" height="100%" src=".github/logo.png" alt="API RESTful"></a>
</p>

<h3 align="center">API RESTful - MySQL Sequelize :: E-commerce Store</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

## 🛍️ Apresentação:

Projeto **CRUD**: API RESTful seguindo conceito **MVC** utilizando Stack **NodeJS**.

Pacotes principais: **Express** responsável pela criação de rotas, Middleware **JWT** para persistência do token por 24 horas, mantendo a segurança e credêncial do usuário, ORM **Sequelize** para conexão com banco de dados relacional (**MySQL**) e por fim, **Jest** para realização de tests.

## ✨ Requisitos

- **Autenticação de Usuário**: Sistema de autenticação seguro baseado em JWT
- **Gerenciamento de Produtos**: Operações CRUD completas para produtos
- **ORM de Banco de Dados**: Sequelize para interações com o banco de dados MySQL
- **Documentação da API**: Interface de Usuário Swagger Integrada
- **Conjunto de Testes**: Jest para testes abrangentes de API
- **Segurança**: Variáveis ​​de ambiente e validação de dados

## 🚀 Início rápido

### Requisitos

- Node.js v18+
- mySQL
- npm or yarn

### Instalação

```bash
# Fazer o clone do repositório
git clone https://github.com/jefferson-gbarbosa/projeto-backend-store

# Navegar até o diretório do projeto
cd projeto-backend-store

# Instalar dependências
npm install

# Configurar variáveis ​​de ambiente
cp .env.example .env

# Configuração do banco de dados
# Execute migrações

npx sequelize-cli db:migrate

# (Opcional) Dados iniciais
npx sequelize-cli db:seed:all

#Executando o aplicativo
npm run dev

# Modo de produção
npm start 
```

### 🔧 Configuração
Edite o arquivo **.env** com sua configuração:

```bash
# Banco de dados
DB_NAME=store_db
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_DIALECT=mysql

# Server
PORT=3000

# Autenticação
JWT_SECRET=your_jwt_secret_key

```
### 📚 API Documentation

Acesse a documentação interativa da API em:

### 🧪Teste
Execute o conjunto de testes com:

```bash
  npm test
```

## Testando API

  Utilize o [Insomnia](https://insomnia.rest/), [Postman](https://www.postman.com/), ou uma extensão do VS Code (REST client) para testar a API.

## 🌐 Endpoints API 

### Autenticação
  Descrição do método endpoint
  POST	/api/auth/register	User registration
  POST	/api/auth/login	User login

### Produtos
  Descrição do método endpoint
  GET	/api/products	List all products
  POST	/api/products	Create new product
  GET	/api/products/:id	Get product details
  PUT	/api/products/:id	Update product
  DELETE	/api/products/:id	Delete product

### Estrutura do Projeto

```bash
    project-root/
          ├── src/ # Código fonte principal
          │     ├── config/ 
          │     ├── controllers/ 
          │     ├── middlewares/
          │     ├── migrations/ 
          │     ├── models/
          │     ├── routes/
          │     └── server.js 
          ├── tests/ # Testes automatizados
          ├── .env.example # Template de variáveis
          └── package.json # Dependências e scripts     
```

### 🤝 Contribuição

  1 - Bifurque o projeto
  2 - Crie seu branch de funcionalidade (git checkout -b feature/AmazingFeature)
  3 - Commit suas alterações (git commit -m 'Add some AmazingFeature')
  4 -Envie para o branch (git push origin feature/AmazingFeature)
  5 - Abra um Pull Request

## Documentação da API (Swagger)

Para documentação da API, acesse o link: 
