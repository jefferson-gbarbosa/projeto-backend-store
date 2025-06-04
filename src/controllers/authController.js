const { User } = require('../config/sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports.createUser = async(req, res) => {
   try {
    const { firstname, surname, email, password, confirmPassword } = req.body;
    if (!firstname || !surname || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'As senhas não coincidem' });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
    

    const hashedPassword = await bcrypt.hash(password, 10);
   
    await User.create({
      firstname,
      surname,
      email,
      password: hashedPassword
    });

    return res.status(201).json({ message: 'Usuário criado com sucesso' });

   } catch ( error ) {
    console.log("err",error)
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
    const token = jwt.sign({ id: user.id, email: user.email },process.env.SECRET, { expiresIn: '1d' });
    
    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao fazer login' });
  }
}

module.exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
      const { id: userId, firstname, surname, email } = user;
      return res.status(200).json({ id: userId, firstname, surname, email });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

module.exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstname, surname, email } = req.body;

  if (!firstname || !surname || !email) {
    return res.status(400).json({ message: 'Campos firstname, surname e email são obrigatórios.' });
  }

  if (parseInt(id) !== req.user.id) {
    return res.status(401).json({ message: 'Não autorizado a atualizar este usuário.' });
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

    await user.update({ firstname, surname, email });

    return res.status(204).send({ id: user.id, firstname, surname, email }); 
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
};

module.exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) !== req.user.id) {
    return res.status(401).json({ message: 'Não autorizado a deletar este usuário.' });
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
