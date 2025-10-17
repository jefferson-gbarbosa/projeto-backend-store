const express = require('express');
const router = express.Router();
const orderTrackingController = require('../controllers/orderTrackingController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

router.get('/timeline/:orderId', authMiddleware.authenticate,authorize(['admin','customer']), orderTrackingController.getTrackingTimeline);
router.get('/:orderId', authMiddleware.authenticate,authorize(['admin','customer']), orderTrackingController.getTrackingByOrder);
router.put('/:id', authMiddleware.authenticate, orderTrackingController.updateTracking);
router.delete('/:id', authMiddleware.authenticate, orderTrackingController.deleteTracking);

module.exports = router;