const { User } = require('../config/sequelize');
const jwt = require('jsonwebtoken');

// Centralizar "strings mágicas" melhora a manutenção e evita erros de digitação.
const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
};

module.exports.publicSignup = async(req, res) => {
   try {
    const { firstname, surname, email, password, confirmPassword } = req.body;

    if (!firstname || !surname || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'As senhas não coincidem' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
     
    await User.create({
      firstname,
      surname,
      email,
      password,
      role: ROLES.CUSTOMER, 
    });

    return res.status(201).json({ message: 'Usuário criado com sucesso' });
   } catch ( error ) {
    return res.status(500).json({ message: 'Erro ao criar usuário' });
   }
};

module.exports.adminSignup = async(req, res) => {
   try {
    const { firstname, surname, email, password, confirmPassword } = req.body;

    if (!firstname || !surname || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'As senhas não coincidem' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
     
    await User.create({
      firstname,
      surname,
      email,
      password,
      role: ROLES.ADMIN, 
    });

    return res.status(201).json({ message: 'Usuário criado com sucesso' });
   } catch ( error ) {
    return res.status(500).json({ message: 'Erro ao criar usuário' });
   }
};

module.exports.loginUser = async(req, res) =>{
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    
    if (!user) return res.status(400).json({ message: 'Credenciais inválidas' });

    const passwordMatch = await user.checkPassword(password);
 
    if (!passwordMatch) return res.status(400).json({ message: 'Credenciais inválidas' });

    const token = jwt.sign(
      { 
        id: user.id, 
        name: `${user.firstname} ${user.surname}`,
        email: user.email, 
        role: user.role 
      }, 
      process.env.SECRET, { expiresIn: '1d' }
    );
    const userName = `${user.firstname} ${user.surname}`;
    res.cookie("token",token, {httpOnly: true, secure: true}).json({ 
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: userName,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Erro no login:", error); 
    return res.status(500).json({ message: 'Erro ao fazer login' });
  }
}

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Nenhum usuário encontrado' });
    }
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
};

module.exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

      if (req.user.role !== ROLES.ADMIN && req.user.id !== parseInt(id)) {
        return res.status(403).json({ message: 'Não autorizado' });
      }
      
      const { password, ...userData } = user.get({ plain: true }); 0
      return res.status(200).json(userData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

module.exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstname, surname, email, role } = req.body;

  if (!firstname || !surname || !email) {
    return res.status(400).json({ message: 'Campos firstname, surname e email são obrigatórios.' });
  }
  if (req.user.role !== ROLES.ADMIN && req.user.id !== parseInt(id)) {
    return res.status(403).json({ message: 'Não autorizado.' });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    if (email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
    }

    const updateData = { firstname, surname, email };
    if (req.user.role === ROLES.ADMIN && role) {
      updateData.role = role;
    }

    await user.update(updateData);

    return res.status(204).send(); 
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
};

module.exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== ROLES.ADMIN && req.user.id !== parseInt(id)) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    await user.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao deletar usuário' });
  }
};

module.exports.logoutUser = (req, res) => {
   res.clearCookie("token").json({
    message: "Logged out successfully!",
  });
}