const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

router.get('/', shopController.showShop);
router.post('/purchase', shopController.purchaseItem);
router.get('/inventory', shopController.getInventory);
router.post('/use', shopController.useItem);

module.exports = router;
