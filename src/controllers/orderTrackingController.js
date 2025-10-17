const { OrderTracking, Order } = require('../config/sequelize');
// Retorna o histórico completo de rastreamento de um pedido
module.exports.getTrackingTimeline = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Verifica se o pedido existe
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
        // Só o customer dono do pedido ou admin pode acessar
    if (req.user.role === 'customer' && req.user.id !== order.user_id) {
      return res.status(403).json({ message: 'Acesso negado ao histórico deste pedido' });
    }
    // Busca todos os rastreios do pedido, ordenados por timestamp
    const tracking = await OrderTracking.findAll({
      where: { order_id: orderId },
      order: [['timestamp', 'ASC']],
    });

    if (!tracking.length) {
      return res.status(404).json({ message: 'Nenhum rastreamento encontrado' });
    }

    // Formata como timeline
    const timeline = tracking.map((t) => ({
      status: t.status,
      location: t.location || 'Não informado',
      note: t.note || '',
      timestamp: t.timestamp,
    }));

    res.status(200).json({
      order_id: orderId,
      current_status: order.status,
      timeline,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar timeline de rastreamento', error: error.message });
  }
};

// Listar rastreamento de um pedido
module.exports.getTrackingByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

    if (req.user.role === 'customer' && req.user.id !== order.user_id) {
      return res.status(403).json({ message: 'Acesso negado ao rastreamento deste pedido' });
    }
    const tracking = await OrderTracking.findAll({
      where: { order_id: orderId },
      order: [['timestamp', 'ASC']],
    });

    if (!tracking.length) {
      return res.status(404).json({ message: 'Nenhum rastreamento encontrado' });
    }

    res.status(200).json(tracking);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar rastreamento', error: error.message });
  }
};

// Atualizar um registro de rastreamento
module.exports.updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, note } = req.body;

    const tracking = await OrderTracking.findByPk(id);
    if (!tracking) return res.status(404).json({ message: 'Rastreamento não encontrado' });

    await tracking.update({ status, location, note });
    res.status(200).json(tracking);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar rastreamento', error: error.message });
  }
};

// Remover um rastreamento
module.exports.deleteTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const tracking = await OrderTracking.findByPk(id);
    if (!tracking) return res.status(404).json({ message: 'Rastreamento não encontrado' });

    await tracking.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar rastreamento', error: error.message });
  }
};
