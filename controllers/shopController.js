const Shop = require('../models/Shop');
const Gamification = require('../models/Gamification');
const User = require('../models/User');

class ShopController {
    async showShop(req, res) {
        try {
            const userId = req.session.userId || req.session.user?.UserID;
            const items = await Shop.getActiveItems();
            const inventory = await Shop.getUserInventory(userId);
            const studentStats = await Gamification.getStudentStats(userId) || {
                TotalXP: 0, Level: 1, CurrentStreak: 0, TotalCoins: 0
            };

            res.render('student/shop', {
                items,
                inventory,
                studentStats,
                user: req.session.user,
                title: 'Tienda de Beneficios',
                cssFile: 'shop.css',
                jsFile: 'shop.js'
            });
        } catch (error) {
            console.error('Error in showShop:', error);
            res.redirect('/student');
        }
    }

    async purchaseItem(req, res) {
        try {
            const userId = req.session.userId || req.session.user?.UserID;
            const { itemId } = req.body;

            await Shop.purchaseItem(userId, parseInt(itemId, 10));
            res.json({ success: true, message: '¡Compra realizada con éxito!' });
        } catch (error) {
            console.error('Error in purchaseItem:', error);
            res.status(400).json({ success: false, error: error.message || 'Error en la compra.' });
        }
    }

    async useItem(req, res) {
        try {
            const userId = req.session.userId || req.session.user?.UserID;
            const { inventoryId } = req.body;

            if (!inventoryId) {
                return res.status(400).json({ success: false, error: 'ID de inventario requerido' });
            }

            await Shop.useItem(parseInt(inventoryId, 10), userId);
            res.json({ success: true, message: '¡Habilidad activada con éxito!' });
        } catch (error) {
            console.error('Error in useItem:', error);
            res.status(400).json({ success: false, error: error.message || 'Error al usar ítem' });
        }
    }

    async getInventory(req, res) {
        try {
            const userId = req.session.userId || req.session.user?.UserID;
            const inventory = await Shop.getUserInventory(userId);
            res.json({ success: true, inventory });
        } catch (error) {
            console.error('Error in getInventory:', error);
            res.status(500).json({ success: false, error: 'Error obteniendo el inventario.' });
        }
    }
}

module.exports = new ShopController();
